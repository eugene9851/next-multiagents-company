import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskPanel } from '@/components/TaskPanel'

describe('TaskPanel', () => {
  it('renders textarea and button', () => {
    render(<TaskPanel onSubmit={vi.fn()} />)
    expect(screen.getByPlaceholderText(/예:/)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onSubmit with textarea value on button click', () => {
    const onSubmit = vi.fn()
    render(<TaskPanel onSubmit={onSubmit} />)
    const textarea = screen.getByPlaceholderText(/예:/)
    fireEvent.change(textarea, { target: { value: '로그인 기능 구현' } })
    fireEvent.click(screen.getByRole('button'))
    expect(onSubmit).toHaveBeenCalledWith('로그인 기능 구현')
  })

  it('clears textarea after submit', () => {
    render(<TaskPanel onSubmit={vi.fn()} />)
    const textarea = screen.getByPlaceholderText(/예:/) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: '테스트' } })
    fireEvent.click(screen.getByRole('button'))
    expect(textarea.value).toBe('')
  })
})
