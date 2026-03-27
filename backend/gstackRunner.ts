import { spawn, ChildProcess } from "child_process"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"

function getSkillPrompt(skillName: string): string {
  const skillBase = join(homedir(), ".claude", "skills", "gstack")

  const candidates = [
    join(skillBase, skillName, "SKILL.md"),
    join(skillBase, "skills", skillName, "SKILL.md"),
    join(skillBase, "skills", `${skillName}.md`),
    join(skillBase, `${skillName}.md`),
  ]

  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8")
    }
  }

  return FALLBACK_PROMPTS[skillName] ?? ""
}

const FALLBACK_PROMPTS: Record<string, string> = {
  "office-hours": `You are a product discovery expert conducting office hours.
Your job: deeply understand the task requirements, identify ambiguities, define scope, and produce a clear product brief.
Be thorough but concise. Output a structured brief with: Goal, User Stories, Scope, and Open Questions.`,

  "plan-ceo-review": `You are a CEO reviewing a product plan from a business perspective.
Evaluate: business value, market fit, strategic risks, resource requirements.
Output: Go/No-Go decision with clear rationale, key concerns, and suggested pivots if any.`,

  "plan-eng-review": `You are a senior software engineer reviewing a technical implementation plan.
Evaluate: architecture soundness, scalability, complexity, implementation risks, test strategy.
Output: Technical assessment with recommended approach, potential blockers, and estimated complexity.`,

  "plan-design-review": `You are a senior product designer reviewing a feature plan.
Evaluate: UX flow, user needs, accessibility, design patterns, edge cases in the UI.
Output: Design assessment with wireframe descriptions, UX recommendations, and design risks.`,

  "qa": `You are a QA engineer writing a comprehensive test plan.
Cover: happy paths, edge cases, error scenarios, accessibility, performance.
Output: Structured test cases with steps, expected results, and severity ratings.`,

  "ship": `You are a DevOps/release engineer preparing for deployment.
Cover: pre-deploy checklist, staging steps, monitoring checks, rollback plan, PR description.
Output: Structured deployment runbook ready to follow step-by-step.`,
}

export class GstackRunner {
  private currentProc: ChildProcess | null = null

  run(
    skillName: string,
    taskDescription: string,
    onChunk: (text: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const skillPrompt = getSkillPrompt(skillName)

      const args: string[] = [
        "--print",
        "--dangerously-skip-permissions",
        "--output-format", "stream-json",
      ]

      if (skillPrompt) {
        args.push("--append-system-prompt", skillPrompt)
      }

      args.push("-p", `Task: ${taskDescription}`)

      const proc = spawn("claude", args)
      this.currentProc = proc

      let buffer = ""

      proc.stdout.on("data", (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const evt = JSON.parse(line)
            if (evt.type === "assistant" && Array.isArray(evt.message?.content)) {
              for (const block of evt.message.content) {
                if (block.type === "text" && block.text) {
                  onChunk(block.text)
                }
              }
            }
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              onChunk(evt.delta.text)
            }
          } catch {
            if (line.trim()) onChunk(line)
          }
        }
      })

      proc.on("close", (code) => {
        this.currentProc = null
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`claude CLI exited with exit code ${code}`))
        }
      })

      proc.on("error", (err) => {
        this.currentProc = null
        reject(new Error(`Failed to spawn claude CLI: ${err.message}`))
      })
    })
  }

  abort(): void {
    this.currentProc?.kill()
    this.currentProc = null
  }
}
