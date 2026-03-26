import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentDot } from '@/components/AgentDot'
import type { AgentState } from '@/types/agent'

const mockAgent: AgentState = {
  id: 'pm', role: 'PM', emoji: '🧠', room: 'pm_zone',
  x: 68, y: 60, status: 'active', message: '분석 중...', color: '#6366f1'
}

describe('AgentDot', () => {
  it('renders agent emoji', () => {
    render(<AgentDot agent={mockAgent} />)
    expect(screen.getByText('🧠')).toBeInTheDocument()
  })

  it('renders agent role label', () => {
    render(<AgentDot agent={mockAgent} />)
    expect(screen.getByText('PM')).toBeInTheDocument()
  })

  it('shows speech bubble when message present', () => {
    render(<AgentDot agent={mockAgent} />)
    expect(screen.getByText('분석 중...')).toBeInTheDocument()
  })

  it('hides speech bubble when message is empty', () => {
    render(<AgentDot agent={{ ...mockAgent, message: '' }} />)
    expect(screen.queryByText('분석 중...')).not.toBeInTheDocument()
  })
})
