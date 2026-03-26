import type { AgentState } from '@/types/agent'
import { ROOMS } from '@/constants/office'
import { AgentDot } from './AgentDot'

interface Props {
  agents: Record<string, AgentState>
}

// Room dimensions and pixel offsets — these define the clickable zone around each agent's home coordinate
const ROOM_BOXES: Record<string, { width: number; height: number; offsetX: number; offsetY: number; border: string; text: string }> = {
  pm_zone:    { width: 130, height: 90,  offsetX: -10, offsetY: -10, border: 'border-indigo-500/40', text: 'text-indigo-400' },
  dev_zone:   { width: 150, height: 90,  offsetX: -10, offsetY: -10, border: 'border-sky-500/40',    text: 'text-sky-400'    },
  meeting:    { width: 120, height: 90,  offsetX: -60, offsetY: -45, border: 'border-purple-500/40', text: 'text-purple-400' },
  qa_zone:    { width: 130, height: 80,  offsetX: -10, offsetY: -10, border: 'border-green-500/40',  text: 'text-green-400'  },
  design:     { width: 140, height: 80,  offsetX: -10, offsetY: -10, border: 'border-orange-500/40', text: 'text-orange-400' },
  ceo_office: { width: 140, height: 75,  offsetX: -10, offsetY: -10, border: 'border-yellow-500/40', text: 'text-yellow-400' },
}

export function OfficeMap({ agents }: Props) {
  return (
    <div
      className="flex-1 relative bg-[#0a0a18] overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(rgba(79,70,229,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,0.04) 1px,transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Rooms — positioned to surround the agent home coordinates */}
      {Object.entries(ROOMS).map(([key, room]) => {
        const box = ROOM_BOXES[key]
        return (
          <div
            key={key}
            className={`absolute flex flex-col items-center justify-center gap-1 rounded-xl border bg-white/2 ${box.border} ${box.text}`}
            style={{
              left: room.x + box.offsetX,
              top: room.y + box.offsetY,
              width: box.width,
              height: box.height,
            }}
          >
            <span className="text-xl">{room.icon}</span>
            <span className="text-[10px] font-bold tracking-wide">{room.label}</span>
          </div>
        )
      })}

      {/* Agent Dots — positioned using framer-motion animate x/y */}
      {Object.values(agents).map(agent => (
        <AgentDot key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
