'use client'

import { motion } from 'framer-motion'
import type { AgentState } from '@/types/agent'
import { SpeechBubble } from './SpeechBubble'

interface Props {
  agent: AgentState
}

export function AgentDot({ agent }: Props) {
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      animate={{ x: agent.x, y: agent.y }}
      transition={{ type: 'tween', duration: 0.8, ease: 'easeInOut' }}
      style={{ top: 0, left: 0 }}
    >
      <div className="relative">
        <SpeechBubble message={agent.message} />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white/20"
          style={{
            backgroundColor: agent.color,
            boxShadow: `0 0 10px ${agent.color}`,
          }}
        >
          {agent.emoji}
        </div>
      </div>
      <span className="text-[8px] text-slate-400 whitespace-nowrap">{agent.role}</span>
    </motion.div>
  )
}
