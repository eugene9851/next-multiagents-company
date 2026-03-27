import { mkdirSync, existsSync } from "fs"
import { execSync } from "child_process"
import { join } from "path"
import { homedir } from "os"
import { GstackRunner } from "./gstackRunner"
import { AGENTS } from "./agents"
import type { AgentEvent, AgentId } from "./types"

export interface PipelineStep {
  agentId: AgentId
  targetRoom: string
  workMessage: string
}

export const PIPELINE: PipelineStep[] = [
  { agentId: "pm",       targetRoom: "pm_zone",      workMessage: "요구사항 분석 + spec.md 작성 중..." },
  { agentId: "ceo",      targetRoom: "ceo_office",    workMessage: "비즈니스 리뷰 + ceo-review.md 작성 중..." },
  { agentId: "designer", targetRoom: "design_zone",   workMessage: "UX 설계 + design.md 작성 중..." },
  { agentId: "dev",      targetRoom: "dev_zone",      workMessage: "코드 구현 중..." },
  { agentId: "qa",       targetRoom: "qa_zone",       workMessage: "테스트 작성 + qa-report.md 작성 중..." },
  { agentId: "devops",   targetRoom: "devops_zone",   workMessage: "배포 체크리스트 작성 중..." },
]

const MOVE_DELAY_MS = 800

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .slice(0, 40)
}

function resolveWorkDir(workDir: string | undefined, taskDescription: string): string {
  if (workDir) return workDir
  const slug = slugify(taskDescription) || "project"
  const date = new Date().toISOString().slice(0, 10)
  return join(homedir(), "agent-projects", `${slug}-${date}`)
}

function ensureProjectDir(workDir: string): void {
  if (!existsSync(workDir)) {
    mkdirSync(workDir, { recursive: true })
    try {
      execSync("git init", { cwd: workDir, stdio: "ignore" })
    } catch {
      // git init failure is non-fatal
    }
  }
}

export class FlowOrchestrator {
  private broadcast: (event: AgentEvent) => void
  private runner: GstackRunner
  private running = false
  private aborted = false
  private resetTimers: ReturnType<typeof setTimeout>[] = []

  constructor(broadcast: (event: AgentEvent) => void) {
    this.broadcast = broadcast
    this.runner = new GstackRunner()
  }

  async run(taskDescription: string, workDir?: string): Promise<void> {
    if (this.running) return
    this.running = true
    this.aborted = false

    const resolvedDir = resolveWorkDir(workDir, taskDescription)
    ensureProjectDir(resolvedDir)
    console.log(`[FlowOrchestrator] Project dir: ${resolvedDir}`)

    try {
      for (const step of PIPELINE) {
        if (this.aborted) break
        await this.executeStep(step, taskDescription, resolvedDir)
      }

      this.broadcast({
        type: "flow_complete",
        agentId: "devops",
        status: "done",
        animState: "idle",
        room: "devops_zone",
        message: "✅ 파이프라인 완료!",
        projectDir: resolvedDir,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("[FlowOrchestrator] Pipeline error:", msg)
      this.broadcast({
        type: "error",
        agentId: "devops",
        status: "error",
        animState: "idle",
        room: "devops_zone",
        message: `오류: ${msg}`,
        errorMsg: msg,
      })
    } finally {
      this.running = false

      this.resetTimers.forEach(clearTimeout)
      this.resetTimers = []

      for (const agent of AGENTS) {
        const t = setTimeout(() => {
          this.broadcast({
            type: "agent_update",
            agentId: agent.id,
            status: "idle",
            animState: "idle",
            room: agent.homeRoom,
            message: "",
          })
        }, 2000)
        this.resetTimers.push(t)
      }
    }
  }

  private async executeStep(step: PipelineStep, taskDescription: string, workDir?: string): Promise<void> {
    this.broadcast({
      type: "agent_update",
      agentId: step.agentId,
      status: "moving",
      animState: "walk",
      room: step.targetRoom,
      message: `이동 중...`,
    })

    await delay(MOVE_DELAY_MS)

    this.broadcast({
      type: "agent_update",
      agentId: step.agentId,
      status: "running",
      animState: "work",
      room: step.targetRoom,
      message: step.workMessage,
    })

    const agentDef = AGENTS.find(a => a.id === step.agentId)
    if (!agentDef) throw new Error(`Unknown agent: ${step.agentId}`)

    await this.runner.run(
      agentDef.gstackSkill,
      taskDescription,
      (chunk) => {
        this.broadcast({
          type: "stream_chunk",
          agentId: step.agentId,
          status: "running",
          animState: "work",
          room: step.targetRoom,
          message: step.workMessage,
          chunk,
        })
      },
      workDir
    )

    this.broadcast({
      type: "agent_done",
      agentId: step.agentId,
      status: "done",
      animState: "idle",
      room: step.targetRoom,
      message: "✓ 완료",
    })

    await delay(500)
  }

  abort(): void {
    this.aborted = true
    this.resetTimers.forEach(clearTimeout)
    this.resetTimers = []
    this.runner.abort()
    this.running = false
  }
}
