interface Props {
  agentCount: number
}

export function TopBar({ agentCount }: Props) {
  return (
    <div className="bg-[#0d0d1f] border-b border-[#1e1e3f] px-5 py-[10px] flex items-center justify-between shrink-0">
      <div className="text-indigo-400 font-bold text-sm tracking-wide">⬡ MULTIAGENT OFFICE</div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" />
        <span className="text-[11px] text-slate-600">
          {agentCount} agents active · 소프트웨어 개발 플로우
        </span>
      </div>
    </div>
  )
}
