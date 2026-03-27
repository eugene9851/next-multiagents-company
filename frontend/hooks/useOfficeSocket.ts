"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { AgentEvent, AgentId, AgentState } from "@/types/agent"
import { AGENT_DEFS } from "@/constants/office"

function buildInitialAgents(): Record<string, AgentState> {
  const result: Record<string, AgentState> = {}
  for (const def of AGENT_DEFS) {
    result[def.id] = {
      id: def.id,
      status: "idle",
      animState: "idle",
      room: def.homeRoom,
      targetRoom: def.homeRoom,
      message: "",
    }
  }
  return result
}

export interface OfficeSocketState {
  agents: Record<string, AgentState>
  outputChunks: Record<string, string>
  log: Array<{ time: string; agentId: string; message: string }>
  selectedAgent: AgentId | null
  connected: boolean
  sendTask: (description: string) => void
  selectAgent: (id: AgentId | null) => void
}

export function useOfficeSocket(url: string): OfficeSocketState {
  const [agents, setAgents] = useState<Record<string, AgentState>>(buildInitialAgents)
  const [outputChunks, setOutputChunks] = useState<Record<string, string>>({})
  const [log, setLog] = useState<Array<{ time: string; agentId: string; message: string }>>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>

    function connect() {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.addEventListener("open", () => setConnected(true))

      ws.addEventListener("close", () => {
        setConnected(false)
        retryTimer = setTimeout(connect, 3000)
      })

      ws.addEventListener("error", () => {
        // onerror fires before onclose; reconnect happens in onclose
      })

      ws.addEventListener("message", (evt: Event) => {
        try {
          const event: AgentEvent = JSON.parse((evt as MessageEvent).data)
          handleEvent(event)
        } catch {
          // ignore malformed messages
        }
      })
    }

    connect()
    return () => {
      clearTimeout(retryTimer)
      wsRef.current?.close()
    }
  }, [url])

  function handleEvent(event: AgentEvent) {
    if (event.type === "stream_chunk" && event.chunk) {
      setOutputChunks(prev => ({
        ...prev,
        [event.agentId]: (prev[event.agentId] ?? "") + event.chunk,
      }))
      return
    }

    setAgents(prev => ({
      ...prev,
      [event.agentId]: {
        id: event.agentId,
        status: event.status,
        animState: event.animState,
        room: event.room,
        targetRoom: event.room,
        message: event.message,
      },
    }))

    if (event.message) {
      const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      setLog(prev => [{ time, agentId: event.agentId, message: event.message }, ...prev].slice(0, 100))
    }

    if (event.type === "flow_complete") {
      setOutputChunks({})
    }
  }

  const sendTask = useCallback((description: string) => {
    const ws = wsRef.current
    // readyState 1 === OPEN
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "start_task", description }))
    }
  }, [])

  const selectAgent = useCallback((id: AgentId | null) => {
    setSelectedAgent(id)
  }, [])

  return { agents, outputChunks, log, selectedAgent, connected, sendTask, selectAgent }
}
