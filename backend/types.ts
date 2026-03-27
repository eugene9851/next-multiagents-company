export type AgentId = "ceo" | "pm" | "designer" | "dev" | "qa" | "devops"

export type AgentStatus = "idle" | "moving" | "running" | "done" | "error"

export type AnimState = "idle" | "walk" | "work"

export interface AgentEvent {
  type: "agent_update" | "stream_chunk" | "agent_done" | "flow_complete" | "error"
  agentId: AgentId
  status: AgentStatus
  animState: AnimState
  room: string
  message: string
  chunk?: string
  errorMsg?: string
}
