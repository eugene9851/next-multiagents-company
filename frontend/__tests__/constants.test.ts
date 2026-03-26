import { describe, it, expect } from 'vitest'
import { ROOMS, AGENTS } from '@/constants/office'

describe('ROOMS', () => {
  it('has 6 rooms with x and y coordinates', () => {
    expect(Object.keys(ROOMS)).toHaveLength(6)
    Object.values(ROOMS).forEach(room => {
      expect(typeof room.x).toBe('number')
      expect(typeof room.y).toBe('number')
      expect(typeof room.label).toBe('string')
      expect(typeof room.icon).toBe('string')
    })
  })
})

describe('AGENTS', () => {
  it('has 6 agents with required fields', () => {
    expect(AGENTS).toHaveLength(6)
    AGENTS.forEach(agent => {
      expect(agent).toHaveProperty('id')
      expect(agent).toHaveProperty('role')
      expect(agent).toHaveProperty('emoji')
      expect(agent).toHaveProperty('color')
      expect(agent).toHaveProperty('homeRoom')
    })
  })

  it('contains ceo, pm, dev, qa, designer, devops', () => {
    const ids = AGENTS.map(a => a.id)
    expect(ids).toContain('ceo')
    expect(ids).toContain('pm')
    expect(ids).toContain('dev')
    expect(ids).toContain('qa')
    expect(ids).toContain('designer')
    expect(ids).toContain('devops')
  })
})
