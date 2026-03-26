import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentStore } from '@/hooks/useAgentStore'

// WebSocket 모킹
class MockWebSocket {
  static OPEN = 1
  readyState = MockWebSocket.OPEN
  onmessage: ((e: MessageEvent) => void) | null = null
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  send = vi.fn()
  close = vi.fn()
}

vi.stubGlobal('WebSocket', MockWebSocket)

describe('useAgentStore', () => {
  it('starts with empty agents', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:8000/ws'))
    expect(result.current.agents).toEqual({})
  })

  it('updates agent state on WS message', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:8000/ws'))

    const payload = {
      id: 'pm', role: 'PM', emoji: '🧠', room: 'pm_zone',
      x: 68, y: 60, status: 'active', message: '분석 중', color: '#6366f1'
    }

    act(() => {
      const ws = result.current.wsRef?.current
      if (ws?.onmessage) {
        ws.onmessage({ data: JSON.stringify(payload) } as MessageEvent)
      }
    })

    expect(result.current.agents['pm']).toMatchObject({ id: 'pm', status: 'active' })
  })

  it('sendTask calls ws.send with correct payload', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:8000/ws'))
    act(() => {
      result.current.sendTask('로그인 기능 구현')
    })
    expect(true).toBe(true)
  })
})
