import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { AgentEvent } from "../types"

// Mock GstackRunner
vi.mock("../gstackRunner", () => ({
  GstackRunner: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn(),
  })),
}))

import { FlowOrchestrator, PIPELINE } from "../flowOrchestrator"

describe("PIPELINE", () => {
  it("has 6 steps in the correct order", () => {
    const ids = PIPELINE.map(s => s.agentId)
    expect(ids).toEqual(["pm", "ceo", "designer", "dev", "qa", "devops"])
  })

  it("each step has agentId, targetRoom, and workMessage", () => {
    for (const step of PIPELINE) {
      expect(step.agentId).toBeTruthy()
      expect(step.targetRoom).toBeTruthy()
      expect(step.workMessage).toBeTruthy()
    }
  })
})

describe("FlowOrchestrator", () => {
  let events: AgentEvent[]
  let broadcast: (e: AgentEvent) => void

  beforeEach(() => {
    vi.useFakeTimers()
    events = []
    broadcast = (e) => events.push(e)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("broadcasts moving status for each agent before running", async () => {
    const orch = new FlowOrchestrator(broadcast)
    const runPromise = orch.run("test task")
    await vi.runAllTimersAsync()
    await runPromise

    const movingEvents = events.filter(e => e.status === "moving")
    expect(movingEvents.length).toBeGreaterThanOrEqual(6)
  })

  it("broadcasts running status for each agent during execution", async () => {
    const orch = new FlowOrchestrator(broadcast)
    const runPromise = orch.run("test task")
    await vi.runAllTimersAsync()
    await runPromise

    const runningEvents = events.filter(e => e.status === "running")
    expect(runningEvents.length).toBeGreaterThanOrEqual(6)
  })

  it("broadcasts flow_complete at the end", async () => {
    const orch = new FlowOrchestrator(broadcast)
    const runPromise = orch.run("test task")
    await vi.runAllTimersAsync()
    await runPromise

    const doneEvent = events.find(e => e.type === "flow_complete")
    expect(doneEvent).toBeDefined()
  })

  it("does not run if already running", async () => {
    const orch = new FlowOrchestrator(broadcast)
    const p1 = orch.run("task 1")
    const p2 = orch.run("task 2")
    await vi.runAllTimersAsync()
    await Promise.all([p1, p2])

    // Only one pipeline should have run (6 moving events, not 12)
    const movingEvents = events.filter(e => e.status === "moving")
    expect(movingEvents.length).toBeLessThanOrEqual(6)
  })
})
