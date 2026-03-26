'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { AgentState } from '@/types/agent'

export interface AgentStore {
  agents: Record<string, AgentState>
  log: string[]
  sendTask: (description: string) => void
  wsRef: React.MutableRefObject<WebSocket | null>
}

export function useAgentStore(url: string): AgentStore {
  const [agents, setAgents] = useState<Record<string, AgentState>>({})
  const [log, setLog] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event: MessageEvent) => {
      const data: AgentState = JSON.parse(event.data)
      setAgents(prev => ({ ...prev, [data.id]: data }))
      if (data.message) {
        const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        setLog(prev => [`${time} ${data.role}: ${data.message}`, ...prev].slice(0, 50))
      }
    }

    ws.onerror = () => {
      console.warn('WebSocket connection failed — is the backend running?')
    }

    return () => ws.close()
  }, [url])

  const sendTask = useCallback((description: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'task', description }))
    }
  }, [])

  return { agents, log, sendTask, wsRef }
}
