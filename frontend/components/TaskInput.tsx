"use client"

import { useState } from "react"

interface TaskInputProps {
  onSubmit: (description: string, workDir?: string) => void
  disabled: boolean
}

export function TaskInput({ onSubmit, disabled }: TaskInputProps) {
  const [value, setValue] = useState("")
  const [workDir, setWorkDir] = useState("")

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed, workDir.trim() || undefined)
    setValue("")
  }

  return (
    <div className="p-4 border-b border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        새 태스크 (CEO 지시)
      </div>

      {/* Project directory */}
      <div className="mb-2">
        <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1">
          프로젝트 경로 (없으면 새로 생성)
        </label>
        <input
          type="text"
          value={workDir}
          onChange={e => setWorkDir(e.target.value)}
          placeholder="/Users/me/my-project"
          disabled={disabled}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono outline-none focus:border-indigo-500 disabled:opacity-50 placeholder:text-slate-700"
        />
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
