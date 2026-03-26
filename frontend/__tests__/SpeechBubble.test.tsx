import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpeechBubble } from '@/components/SpeechBubble'

describe('SpeechBubble', () => {
  it('renders message text', () => {
    render(<SpeechBubble message="코딩 중..." />)
    expect(screen.getByText('코딩 중...')).toBeInTheDocument()
  })

  it('renders nothing when message is empty', () => {
    const { container } = render(<SpeechBubble message="" />)
    expect(container.firstChild).toBeNull()
  })
})
