import type { AgentDef, RoomDef } from "@/types/agent"

export const ROOM_DEFS: RoomDef[] = [
  { id: "ceo_office",  label: "CEO 오피스", position: [0,   0, -8], color: "#eab308" },
  { id: "pm_zone",     label: "PM 존",      position: [-6,  0, -4], color: "#6366f1" },
  { id: "meeting",     label: "미팅룸",     position: [0,   0,  0], color: "#64748b" },
  { id: "dev_zone",    label: "Dev 존",     position: [6,   0, -4], color: "#0ea5e9" },
  { id: "qa_zone",     label: "QA 존",      position: [-6,  0,  4], color: "#a855f7" },
  { id: "design_zone", label: "Design 존",  position: [6,   0,  4], color: "#22c55e" },
  { id: "devops_zone", label: "DevOps 존",  position: [0,   0,  8], color: "#f97316" },
]

export const AGENT_DEFS: AgentDef[] = [
  { id: "ceo",      role: "CEO",      color: "#eab308", homeRoom: "ceo_office",  gstackSkill: "plan-ceo-review" },
  { id: "pm",       role: "PM",       color: "#6366f1", homeRoom: "pm_zone",     gstackSkill: "office-hours" },
  { id: "designer", role: "Designer", color: "#22c55e", homeRoom: "design_zone", gstackSkill: "plan-design-review" },
  { id: "dev",      role: "Dev",      color: "#0ea5e9", homeRoom: "dev_zone",    gstackSkill: "plan-eng-review" },
  { id: "qa",       role: "QA",       color: "#a855f7", homeRoom: "qa_zone",     gstackSkill: "qa" },
  { id: "devops",   role: "DevOps",   color: "#f97316", homeRoom: "devops_zone", gstackSkill: "ship" },
]

export function getRoomPosition(roomId: string): [number, number, number] {
  return ROOM_DEFS.find(r => r.id === roomId)?.position ?? [0, 0, 0]
}

export function getRoomColor(roomId: string): string {
  return ROOM_DEFS.find(r => r.id === roomId)?.color ?? "#334155"
}

export function getAgentDef(id: string): AgentDef | undefined {
  return AGENT_DEFS.find(a => a.id === id)
}
