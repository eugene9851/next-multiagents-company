import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityLog } from '@/components/ActivityLog'

describe('ActivityLog', () => {
  it('renders log entries', () => {
    render(<ActivityLog log={['09:01 PM: 분석 시작', '09:02 Dev: 코딩 시작']} />)
    expect(screen.getByText('09:01 PM: 분석 시작')).toBeInTheDocument()
    expect(screen.getByText('09:02 Dev: 코딩 시작')).toBeInTheDocument()
  })

  it('renders empty state when no logs', () => {
    const { container } = render(<ActivityLog log={[]} />)
    expect(container.querySelector('.log-entry')).toBeNull()
  })
})
