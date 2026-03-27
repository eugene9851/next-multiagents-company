"use client"

import { useState } from "react"

interface TaskInputProps {
  onSubmit: (description: string) => void
  disabled: boolean
}

export function TaskInput({ onSubmit, disabled }: TaskInputProps) {
  const [value, setValue] = useState("")

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue("")
  }

  return (
    <div className="p-4 border-b border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        새 태스크 (CEO 지시)
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
        }}
        placeholder="예: 로그인 기능을 OAuth2로 구현해줘..."
        disabled={disabled}
        rows={3}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none outline-none focus:border-indigo-500 disabled:opacity-50 placeholder:text-slate-600"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="mt-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold py-2 rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {disabled ? "⏳ 실행 중..." : "▶ 팀에게 지시 (⌘Enter)"}
      </button>
    </div>
  )
}
