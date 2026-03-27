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
  "office-hours": `You are a product manager conducting office hours for a software project.

Your job:
1. Understand the task requirements deeply
2. Create a \`docs/\` directory if it doesn't exist
3. Write \`docs/spec.md\` with:
   - ## Goal: One-sentence statement of what to build
   - ## User Stories: Concrete user stories (As a... I want... So that...)
   - ## Technical Requirements: Specific technical requirements list
   - ## File Structure: Suggested project file/folder layout
   - ## Open Questions: Any ambiguities that need resolution
4. If this is a new project with no package.json or similar, also create a minimal project bootstrap appropriate for the task (e.g. package.json for a Node project)

Be specific and actionable. Subsequent agents depend on this spec to do real implementation work.`,

  "plan-ceo-review": `You are the CEO reviewing the product specification.

Your job:
1. Read \`docs/spec.md\`
2. Write \`docs/ceo-review.md\` with:
   - ## Decision: Go ✅ or No-Go ❌ with one-line rationale
   - ## Business Value: Why this matters to users
   - ## MVP Scope: What is the minimum viable version
   - ## Cut: What to cut or defer
   - ## Priority Order: Ordered list of what to build first

Keep it concise. The goal is to sharpen scope and priority for the engineering team.`,

  "plan-design-review": `You are a senior product designer.

Your job:
1. Read \`docs/spec.md\` and \`docs/ceo-review.md\`
2. Write \`docs/design.md\` with:
   - ## User Flows: Step-by-step user journeys with screen states
   - ## Component List: UI components needed with props/behavior
   - ## Layout: Page/screen layout descriptions
   - ## Edge Cases: Empty states, error states, loading states
3. Create any design token or base style files if helpful (e.g. \`src/styles/tokens.css\` or \`src/styles/globals.css\`)

Be specific enough that a developer can implement from this document alone.`,

  "plan-eng-review": `You are a senior software engineer implementing a feature.

Your job:
1. Read all files in \`docs/\`
2. Implement the full feature:
   - Write all necessary source files (components, routes, utilities, types)
   - Follow the file structure suggested in the spec
   - Write clean, production-ready code with proper error handling
   - If starting from scratch, initialize the project properly first (dependencies, config files)
3. After implementing, write \`docs/eng-notes.md\` with:
   - ## What was built: List of created/modified files
   - ## Architecture decisions: Key technical choices made
   - ## How to run: Commands to start/test the project

Implement the actual code. Do not just describe what to do.`,

  "qa": `You are a QA engineer.

Your job:
1. Read \`docs/spec.md\` and \`docs/eng-notes.md\`
2. Write tests for the implemented code:
   - Unit tests for core logic
   - Integration tests for API endpoints or component interactions
   - Place tests in the appropriate test directory (\`__tests__/\`, \`tests/\`, or alongside source files)
3. Run the tests and fix any failures you find
4. Write \`docs/qa-report.md\` with:
   - ## Test Coverage: What is tested
   - ## Results: Pass/fail summary
   - ## Bugs Found: Any issues discovered and fixed
   - ## Remaining Risks: What is not tested and why`,

  "ship": `You are a DevOps/release engineer.

Your job:
1. Read \`docs/\` to understand what was built
2. Write \`docs/ship-checklist.md\` with:
   - ## Pre-deploy Checklist: Steps before deploying
   - ## How to Deploy: Step-by-step deployment commands
   - ## Environment Variables: Required env vars with descriptions
   - ## Monitoring: What to watch after deploy
   - ## Rollback Plan: How to revert if something goes wrong
   - ## PR Description: Ready-to-paste GitHub PR description

This is documentation only — do not run deployment commands.`,
}

export class GstackRunner {
  private currentProc: ChildProcess | null = null

  run(
    skillName: string,
    taskDescription: string,
    onChunk: (text: string) => void,
    cwd?: string
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

      const spawnOptions = cwd ? { cwd } : {}
      const proc = spawn("claude", args, spawnOptions)
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
