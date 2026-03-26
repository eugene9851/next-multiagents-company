import type { AgentState } from '@/types/agent'

interface Props {
  agents: Record<string, AgentState>
}

const badgeClass: Record<string, string> = {
  active:  'bg-green-500/15 text-green-300',
  idle:    'bg-slate-500/15 text-slate-500',
  meeting: 'bg-purple-500/15 text-purple-300',
}

const badgeLabel: Record<string, string> = {
  active: 'ACTIVE', idle: 'IDLE', meeting: 'MTG',
}

export function AgentStatusList({ agents }: Props) {
  return (
    <div className="p-4 border-b border-[#1e1e3f]">
      <div className="text-[10px] font-bold tracking-[1.5px] text-slate-600 mb-3">🤖 에이전트 현황</div>
      {Object.values(agents).map(agent => (
        <div key={agent.id} className="flex items-center gap-2 py-[6px] border-b border-[#0f0f20] last:border-0">
          <span className="text-base w-6 text-center">{agent.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-200">{agent.role}</div>
            <div className="text-[9px] text-slate-600 truncate">{agent.message || '대기 중'}</div>
          </div>
          <span className={`text-[8px] px-[6px] py-[2px] rounded-full font-semibold flex-shrink-0 ${badgeClass[agent.status]}`}>
            {badgeLabel[agent.status]}
          </span>
        </div>
      ))}
    </div>
  )
}
