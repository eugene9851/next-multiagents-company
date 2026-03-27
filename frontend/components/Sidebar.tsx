"use client"

import { TaskInput } from "./TaskInput"
import { AgentStatusList } from "./AgentStatusList"
import { OutputPanel } from "./OutputPanel"
import { ActivityLog } from "./ActivityLog"
import type { AgentState, AgentId } from "@/types/agent"

interface SidebarProps {
  agents: Record<string, AgentState>
  outputChunks: Record<string, string>
  log: Array<{ time: string; agentId: string; message: string }>
  selectedAgent: AgentId | null
  connected: boolean
  onTaskSubmit: (description: string) => void
  onSelectAgent: (id: AgentId) => void
}

function isRunning(agents: Record<string, AgentState>): boolean {
  return Object.values(agents).some(
    a => a.status === "running" || a.status === "moving"
  )
}

export function Sidebar({
  agents,
  outputChunks,
  log,
  selectedAgent,
  connected,
  onTaskSubmit,
  onSelectAgent,
}: SidebarProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-slate-900/80 border-l border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-sm font-bold text-indigo-400 tracking-widest">⚡ AI COMPANY</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`} />
          <span className="text-[10px] text-slate-500">
            {connected ? "연결됨" : "연결 중..."}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <TaskInput onSubmit={onTaskSubmit} disabled={!connected || isRunning(agents)} />
        <AgentStatusList agents={agents} selectedAgent={selectedAgent} onSelect={onSelectAgent} />
        <OutputPanel selectedAgent={selectedAgent} outputChunks={outputChunks} />
        <ActivityLog log={log} />
      </div>
    </div>
  )
}
