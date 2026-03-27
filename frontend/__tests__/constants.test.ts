import { describe, it, expect } from 'vitest'
import { ROOM_DEFS, AGENT_DEFS } from '@/constants/office'

describe('ROOM_DEFS', () => {
  it('has 7 rooms with 3D position and color', () => {
    expect(ROOM_DEFS).toHaveLength(7)
    ROOM_DEFS.forEach(room => {
      expect(room.id).toBeTruthy()
      expect(room.label).toBeTruthy()
      expect(room.position).toHaveLength(3)
      expect(room.color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})

describe('AGENT_DEFS', () => {
  it('has 6 agents with required fields', () => {
    expect(AGENT_DEFS).toHaveLength(6)
    AGENT_DEFS.forEach(agent => {
      expect(agent).toHaveProperty('id')
      expect(agent).toHaveProperty('role')
      expect(agent).toHaveProperty('color')
      expect(agent).toHaveProperty('homeRoom')
      expect(agent).toHaveProperty('gstackSkill')
    })
  })

  it('contains ceo, pm, dev, qa, designer, devops', () => {
    const ids = AGENT_DEFS.map(a => a.id)
    expect(ids).toContain('ceo')
    expect(ids).toContain('pm')
    expect(ids).toContain('dev')
    expect(ids).toContain('qa')
    expect(ids).toContain('designer')
    expect(ids).toContain('devops')
  })
})
