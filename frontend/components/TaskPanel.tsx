'use client'

import { useState } from 'react'

interface Props {
  onSubmit: (description: string) => void
}

export function TaskPanel({ onSubmit }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className="p-4 border-b border-[#1e1e3f]">
      <div className="text-[10px] font-bold tracking-[1.5px] text-slate-600 mb-3">📥 태스크 입력</div>
      <textarea
        className="w-full bg-[#0a0a18] border border-[#1e1e3f] rounded-lg px-3 py-2 text-[11px] text-slate-200 resize-none h-14 outline-none placeholder:text-slate-700"
        placeholder="예: 로그인 기능 만들어줘..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        className="mt-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg py-2 text-[11px] font-semibold text-white tracking-wide"
        onClick={handleSubmit}
      >
        ▶ 시뮬레이션 시작
      </button>
    </div>
  )
}
