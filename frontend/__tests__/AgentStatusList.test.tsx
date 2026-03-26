import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentStatusList } from '@/components/AgentStatusList'
import type { AgentState } from '@/types/agent'

const mockAgents: Record<string, AgentState> = {
  pm: { id: 'pm', role: 'PM', emoji: '🧠', room: 'pm_zone', x: 68, y: 60, status: 'active', message: '분석 중', color: '#6366f1' },
  dev: { id: 'dev', role: 'Dev', emoji: '⚙️', room: 'dev_zone', x: 580, y: 60, status: 'idle', message: '', color: '#0ea5e9' },
}

describe('AgentStatusList', () => {
  it('renders all agent roles', () => {
    render(<AgentStatusList agents={mockAgents} />)
    expect(screen.getByText('PM')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('shows ACTIVE badge for active agent', () => {
    render(<AgentStatusList agents={mockAgents} />)
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('shows IDLE badge for idle agent', () => {
    render(<AgentStatusList agents={mockAgents} />)
    expect(screen.getByText('IDLE')).toBeInTheDocument()
  })
})
