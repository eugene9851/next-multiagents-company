import type { AgentState } from '@/types/agent'
import { TaskPanel } from './TaskPanel'
import { AgentStatusList } from './AgentStatusList'
import { ActivityLog } from './ActivityLog'

interface Props {
  agents: Record<string, AgentState>
  log: string[]
  onTaskSubmit: (description: string) => void
}

export function Sidebar({ agents, log, onTaskSubmit }: Props) {
  return (
    <div className="w-64 bg-[#0d0d1f] border-l border-[#1e1e3f] flex flex-col flex-shrink-0">
      <TaskPanel onSubmit={onTaskSubmit} />
      <AgentStatusList agents={agents} />
      <div className="px-4 py-2 border-b border-[#1e1e3f]">
        <div className="text-[10px] font-bold tracking-[1.5px] text-slate-600">📜 활동 로그</div>
      </div>
      <ActivityLog log={log} />
    </div>
  )
}
