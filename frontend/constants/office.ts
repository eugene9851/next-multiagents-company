import type { Room, AgentConfig, RoomKey } from '@/types/agent'

export const ROOMS: Record<RoomKey, Room> = {
  pm_zone:    { x: 68,  y: 60,  label: 'PM',         icon: '📋' },
  dev_zone:   { x: 580, y: 60,  label: 'DEVELOPMENT', icon: '💻' },
  meeting:    { x: 330, y: 270, label: '회의실',       icon: '🤝' },
  qa_zone:    { x: 68,  y: 420, label: 'QA',          icon: '🧪' },
  design:     { x: 580, y: 390, label: 'DESIGN',      icon: '🎨' },
  ceo_office: { x: 580, y: 480, label: 'CEO OFFICE',  icon: '👔' },
}

export const AGENTS: AgentConfig[] = [
  { id: 'ceo',      role: 'CEO',      emoji: '👔', color: '#eab308', homeRoom: 'ceo_office' },
  { id: 'pm',       role: 'PM',       emoji: '🧠', color: '#6366f1', homeRoom: 'pm_zone'    },
  { id: 'dev',      role: 'Dev',      emoji: '⚙️', color: '#0ea5e9', homeRoom: 'dev_zone'   },
  { id: 'qa',       role: 'QA',       emoji: '🔬', color: '#a855f7', homeRoom: 'qa_zone'    },
  { id: 'designer', role: 'Designer', emoji: '🎨', color: '#22c55e', homeRoom: 'design'     },
  { id: 'devops',   role: 'DevOps',   emoji: '🚀', color: '#f97316', homeRoom: 'meeting'    }, // no dedicated zone; DevOps operates from the meeting room
]
