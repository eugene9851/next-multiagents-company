import type { AgentState } from '@/types/agent'
import { ROOMS } from '@/constants/office'
import { AgentDot } from './AgentDot'

interface Props {
  agents: Record<string, AgentState>
}

const roomStyle: Record<string, string> = {
  pm_zone:    'left-10 top-10 w-[130px] h-[90px] border-indigo-500/40 text-indigo-400',
  dev_zone:   'right-10 top-10 w-[150px] h-[90px] border-sky-500/40 text-sky-400',
  meeting:    'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[85px] border-purple-500/40 text-purple-400',
  qa_zone:    'left-10 bottom-10 w-[130px] h-[80px] border-green-500/40 text-green-400',
  design:     'right-10 bottom-24 w-[140px] h-[80px] border-orange-500/40 text-orange-400',
  ceo_office: 'right-10 bottom-4 w-[140px] h-[75px] border-yellow-500/40 text-yellow-400',
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
      {/* Rooms */}
      {Object.entries(ROOMS).map(([key, room]) => (
        <div
          key={key}
          className={`absolute flex flex-col items-center justify-center gap-1 rounded-xl border bg-white/[0.02] ${roomStyle[key]}`}
        >
          <span className="text-xl">{room.icon}</span>
          <span className="text-[10px] font-bold tracking-wide">{room.label}</span>
        </div>
      ))}

      {/* Agent Dots */}
      {Object.values(agents).map(agent => (
        <AgentDot key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
