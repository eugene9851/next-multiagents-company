"use client"

import { AGENT_DEFS } from "@/constants/office"

interface LogEntry {
  time: string
  agentId: string
  message: string
}

interface ActivityLogProps {
  log: LogEntry[]
}

export function ActivityLog({ log }: ActivityLogProps) {
  const getColor = (agentId: string) =>
    AGENT_DEFS.find(a => a.id === agentId)?.color ?? "#64748b"
  const getRole = (agentId: string) =>
    AGENT_DEFS.find(a => a.id === agentId)?.role ?? agentId

  return (
    <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        활동 로그
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {log.length === 0 ? (
          <p className="text-[10px] text-slate-600 font-mono">
            태스크를 시작하면 로그가 표시됩니다
          </p>
        ) : (
          log.map((entry, i) => (
            <div key={`${entry.time}-${entry.agentId}-${i}`} className="flex gap-2 text-[10px] font-mono border-b border-slate-900 pb-1">
              <span className="text-slate-600 flex-shrink-0">{entry.time}</span>
              <span className="font-bold flex-shrink-0" style={{ color: getColor(entry.agentId) }}>
                {getRole(entry.agentId)}
              </span>
              <span className="text-slate-400 truncate">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
