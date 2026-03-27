import type { AgentId } from "./types"

export interface AgentDef {
  id: AgentId
  role: string
  color: string
  homeRoom: string
  gstackSkill: string
}

export interface RoomDef {
  id: string
  label: string
  position: [number, number, number]
}

export const ROOMS: RoomDef[] = [
  { id: "ceo_office",  label: "CEO 오피스", position: [0,   0, -8] },
  { id: "pm_zone",     label: "PM 존",      position: [-6,  0, -4] },
  { id: "meeting",     label: "미팅룸",     position: [0,   0,  0] },
  { id: "dev_zone",    label: "Dev 존",     position: [6,   0, -4] },
  { id: "qa_zone",     label: "QA 존",      position: [-6,  0,  4] },
  { id: "design_zone", label: "Design 존",  position: [6,   0,  4] },
  { id: "devops_zone", label: "DevOps 존",  position: [0,   0,  8] },
]

export const AGENTS: AgentDef[] = [
  { id: "ceo",      role: "CEO",      color: "#eab308", homeRoom: "ceo_office",  gstackSkill: "agent-ceo" },
  { id: "pm",       role: "PM",       color: "#6366f1", homeRoom: "pm_zone",     gstackSkill: "agent-pm" },
  { id: "designer", role: "Designer", color: "#22c55e", homeRoom: "design_zone", gstackSkill: "agent-designer" },
  { id: "dev",      role: "Dev",      color: "#0ea5e9", homeRoom: "dev_zone",    gstackSkill: "agent-dev" },
  { id: "qa",       role: "QA",       color: "#a855f7", homeRoom: "qa_zone",     gstackSkill: "agent-qa" },
  { id: "devops",   role: "DevOps",   color: "#f97316", homeRoom: "devops_zone", gstackSkill: "agent-devops" },
]

export function getAgentDef(id: string): AgentDef | undefined {
  return AGENTS.find(a => a.id === id)
}

export function getRoomPosition(roomId: string): [number, number, number] {
  return ROOMS.find(r => r.id === roomId)?.position ?? [0, 0, 0]
}
