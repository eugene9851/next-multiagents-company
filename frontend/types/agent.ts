export type AgentId = "ceo" | "pm" | "designer" | "dev" | "qa" | "devops"

export type AgentStatus = "idle" | "moving" | "running" | "done" | "error"

export type AnimState = "idle" | "walk" | "work"

export interface RoomDef {
  id: string
  label: string
  position: [number, number, number]  // [x, y, z] in 3D world units
  color: string                        // hex, used for room floor glow
}

export interface AgentDef {
  id: AgentId
  role: string
  color: string          // hex color for character body
  homeRoom: string       // room id
  gstackSkill: string    // skill name passed to gstackRunner
}

export interface AgentState {
  id: AgentId
  status: AgentStatus
  animState: AnimState
  room: string           // current room id
  targetRoom: string     // room id the agent is moving to (same as room if not moving)
  message: string        // speech bubble text
}

// WebSocket: server → client
export interface AgentEvent {
  type: "agent_update" | "stream_chunk" | "agent_done" | "flow_complete" | "error"
  agentId: AgentId
  status: AgentStatus
  animState: AnimState
  room: string
  message: string
  chunk?: string         // only for stream_chunk events
  errorMsg?: string      // only for error events
}

// WebSocket: client → server
export interface StartTaskMessage {
  type: "start_task"
  description: string
}
