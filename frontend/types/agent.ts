export type RoomKey =
  | 'pm_zone'
  | 'dev_zone'
  | 'meeting'
  | 'qa_zone'
  | 'design'
  | 'ceo_office'

export type AgentStatus = 'active' | 'idle' | 'meeting'

export interface AgentState {
  id: string
  role: string
  emoji: string
  room: RoomKey
  x: number
  y: number
  status: AgentStatus
  message: string
  color: string
}

export interface Room {
  x: number
  y: number
  label: string
  icon: string
}

export interface AgentConfig {
  id: string
  role: string
  emoji: string
  color: string
  homeRoom: RoomKey
}

export interface TaskMessage {
  type: 'task'
  description: string
}
