"use client"

import type { AgentState, AgentId } from "@/types/agent"
import { AGENT_DEFS } from "@/constants/office"

interface AgentStatusListProps {
  agents: Record<string, AgentState>
  selectedAgent: AgentId | null
  onSelect: (id: AgentId) => void
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  idle:    { label: "대기",      className: "bg-slate-800 text-slate-500" },
  moving:  { label: "이동 중",   className: "bg-yellow-900/40 text-yellow-400" },
  running: { label: "● 실행 중", className: "bg-green-900/40 text-green-400" },
  done:    { label: "✓ 완료",    className: "bg-blue-900/40 text-blue-400" },
  error:   { label: "✗ 오류",    className: "bg-red-900/40 text-red-400" },
}

export function AgentStatusList({ agents, selectedAgent, onSelect }: AgentStatusListProps) {
  return (
    <div className="p-4 border-b border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">팀 현황</div>
      <div className="space-y-1">
        {AGENT_DEFS.map(def => {
          const state = agents[def.id]
          if (!state) return null
          const badge = STATUS_BADGE[state.status] ?? STATUS_BADGE.idle
          const isSelected = selectedAgent === def.id

          return (
            <button
              key={def.id}
              onClick={() => onSelect(def.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                isSelected ? "bg-slate-700" : "hover:bg-slate-800/60"
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${def.color}22`, border: `1px solid ${def.color}55`, color: def.color }}
              >
                {def.role[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-200">{def.role}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                  {state.message || "대기 중"}
                </div>
              </div>
              <div className={`text-[9px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${badge.className}`}>
                {badge.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
