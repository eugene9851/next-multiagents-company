import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useOfficeSocket } from "../hooks/useOfficeSocket"
import type { AgentEvent } from "../types/agent"

// WebSocket mock
class MockWebSocket extends EventTarget {
  readyState = 1 // OPEN
  sent: string[] = []
  static instances: MockWebSocket[] = []

  constructor(public url: string) {
    super()
    MockWebSocket.instances.push(this)
  }

  send(data: string) { this.sent.push(data) }
  close() { this.readyState = 3 }

  simulateMessage(event: AgentEvent) {
    const messageEvent = new MessageEvent("message", { data: JSON.stringify(event) })
    this.dispatchEvent(messageEvent)
  }
}

vi.stubGlobal("WebSocket", MockWebSocket)

const PM_UPDATE: AgentEvent = {
  type: "agent_update",
  agentId: "pm",
  status: "running",
  animState: "work",
  room: "pm_zone",
  message: "분석 중...",
}

describe("useOfficeSocket", () => {
  beforeEach(() => { MockWebSocket.instances = [] })

  it("initializes with 6 idle agents", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    expect(Object.keys(result.current.agents)).toHaveLength(6)
    for (const state of Object.values(result.current.agents)) {
      expect(state.status).toBe("idle")
    }
  })

  it("updates agent state on agent_update event", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    const ws = MockWebSocket.instances[0]

    act(() => ws.simulateMessage(PM_UPDATE))

    expect(result.current.agents["pm"].status).toBe("running")
    expect(result.current.agents["pm"].message).toBe("분석 중...")
  })

  it("appends chunks to outputChunks on stream_chunk", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    const ws = MockWebSocket.instances[0]

    act(() => ws.simulateMessage({ ...PM_UPDATE, type: "stream_chunk", chunk: "hello " }))
    act(() => ws.simulateMessage({ ...PM_UPDATE, type: "stream_chunk", chunk: "world" }))

    expect(result.current.outputChunks["pm"]).toBe("hello world")
  })

  it("sendTask sends JSON to WebSocket", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    const ws = MockWebSocket.instances[0]

    act(() => result.current.sendTask("로그인 기능"))

    expect(ws.sent).toHaveLength(1)
    expect(JSON.parse(ws.sent[0])).toEqual({ type: "start_task", description: "로그인 기능" })
  })
})
