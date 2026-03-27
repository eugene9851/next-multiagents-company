import { describe, it, expect } from "vitest"
import { AGENTS, ROOMS, getAgentDef, getRoomPosition } from "../agents"

describe("AGENTS registry", () => {
  it("has exactly 6 agents", () => {
    expect(AGENTS).toHaveLength(6)
  })

  it("each agent has required fields", () => {
    for (const agent of AGENTS) {
      expect(agent.id).toBeTruthy()
      expect(agent.role).toBeTruthy()
      expect(agent.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(agent.homeRoom).toBeTruthy()
      expect(agent.gstackSkill).toBeTruthy()
    }
  })
})

describe("getAgentDef", () => {
  it("returns agent by id", () => {
    const agent = getAgentDef("pm")
    expect(agent?.role).toBe("PM")
    expect(agent?.gstackSkill).toBe("office-hours")
  })

  it("returns undefined for unknown id", () => {
    expect(getAgentDef("unknown" as any)).toBeUndefined()
  })
})

describe("getRoomPosition", () => {
  it("returns [x, y, z] tuple for known room", () => {
    const pos = getRoomPosition("meeting")
    expect(pos).toHaveLength(3)
    expect(typeof pos[0]).toBe("number")
  })

  it("returns origin for unknown room", () => {
    expect(getRoomPosition("unknown")).toEqual([0, 0, 0])
  })
})
