interface Props {
  log: string[]
}

export function ActivityLog({ log }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {log.map((entry, i) => (
        <div key={i} className="text-[9px] text-slate-600 py-[3px] border-b border-[#0f0f20] leading-relaxed log-entry">
          {entry}
        </div>
      ))}
    </div>
  )
}
