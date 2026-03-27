"use client"

import { useEffect, useRef } from "react"
import type { AgentId } from "@/types/agent"
import { AGENT_DEFS } from "@/constants/office"

interface OutputPanelProps {
  selectedAgent: AgentId | null
  outputChunks: Record<string, string>
}

export function OutputPanel({ selectedAgent, outputChunks }: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const agentDef = AGENT_DEFS.find(a => a.id === selectedAgent)
  const output = selectedAgent ? (outputChunks[selectedAgent] ?? "") : ""

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="p-4 border-b border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {agentDef ? (
          <span>
            <span style={{ color: agentDef.color }}>{agentDef.role}</span>
            {" "}출력
          </span>
        ) : (
          "출력 (캐릭터 클릭)"
        )}
      </div>
      <div
        ref={scrollRef}
        className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-36 overflow-y-auto"
      >
        {output ? (
          <pre className="text-[10px] text-cyan-300 font-mono whitespace-pre-wrap leading-relaxed">
            {output}
            <span className="animate-pulse">▋</span>
          </pre>
        ) : (
          <p className="text-[10px] text-slate-600 font-mono">
            {selectedAgent
              ? "아직 출력 없음"
              : "캐릭터를 클릭하면 출력이 표시됩니다"}
          </p>
        )}
      </div>
    </div>
  )
}
