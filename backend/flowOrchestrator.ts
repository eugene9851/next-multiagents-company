import { GstackRunner } from "./gstackRunner"
import { AGENTS } from "./agents"
import type { AgentEvent, AgentId } from "./types"

export interface PipelineStep {
  agentId: AgentId
  targetRoom: string
  workMessage: string
}

export const PIPELINE: PipelineStep[] = [
  { agentId: "pm",       targetRoom: "pm_zone",      workMessage: "/office-hours 실행 중..." },
  { agentId: "ceo",      targetRoom: "ceo_office",    workMessage: "/plan-ceo-review 중..." },
  { agentId: "designer", targetRoom: "design_zone",   workMessage: "/plan-design-review 중..." },
  { agentId: "dev",      targetRoom: "dev_zone",      workMessage: "/plan-eng-review + 빌드 중..." },
  { agentId: "qa",       targetRoom: "qa_zone",       workMessage: "/qa 테스트 실행 중..." },
  { agentId: "devops",   targetRoom: "devops_zone",   workMessage: "/ship 배포 준비 중..." },
]

const MOVE_DELAY_MS = 800

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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

  async run(taskDescription: string): Promise<void> {
    if (this.running) return
    this.running = true
    this.aborted = false

    try {
      for (const step of PIPELINE) {
        if (this.aborted) break
        await this.executeStep(step, taskDescription)
      }

      this.broadcast({
        type: "flow_complete",
        agentId: "devops",
        status: "done",
        animState: "idle",
        room: "devops_zone",
        message: "✅ 파이프라인 완료!",
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
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

      // Clear any existing reset timers before scheduling new ones
      this.resetTimers.forEach(clearTimeout)
      this.resetTimers = []

      // Reset all agents to idle after 2 seconds
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

  private async executeStep(step: PipelineStep, taskDescription: string): Promise<void> {
    // 1. Announce movement
    this.broadcast({
      type: "agent_update",
      agentId: step.agentId,
      status: "moving",
      animState: "walk",
      room: step.targetRoom,
      message: `이동 중...`,
    })

    await delay(MOVE_DELAY_MS)

    // 2. Announce work start
    this.broadcast({
      type: "agent_update",
      agentId: step.agentId,
      status: "running",
      animState: "work",
      room: step.targetRoom,
      message: step.workMessage,
    })

    // 3. Run gstack skill
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
      }
    )

    // 4. Announce completion
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
