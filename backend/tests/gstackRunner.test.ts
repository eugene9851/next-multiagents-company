import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventEmitter } from "events"

// child_process mock
const mockProc = new EventEmitter() as any
mockProc.stdout = new EventEmitter()
mockProc.stderr = new EventEmitter()
mockProc.kill = vi.fn()

vi.mock("child_process", () => ({
  spawn: vi.fn(() => mockProc),
}))

import { GstackRunner } from "../gstackRunner"

describe("GstackRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset event emitter listeners
    mockProc.stdout.removeAllListeners()
    mockProc.removeAllListeners()
  })

  it("calls onChunk with streamed text from stream-json format", async () => {
    const chunks: string[] = []
    const runner = new GstackRunner()

    const promise = runner.run("office-hours", "로그인 기능 구현", (chunk) => {
      chunks.push(chunk)
    })

    // Simulate stream-json data
    mockProc.stdout.emit(
      "data",
      Buffer.from('{"type":"assistant","message":{"content":[{"type":"text","text":"분석중..."}]}}\n')
    )
    mockProc.emit("close", 0)

    await promise
    expect(chunks).toContain("분석중...")
  })

  it("calls onChunk with text_delta format", async () => {
    const chunks: string[] = []
    const runner = new GstackRunner()

    const promise = runner.run("office-hours", "task", (chunk) => {
      chunks.push(chunk)
    })

    mockProc.stdout.emit(
      "data",
      Buffer.from('{"type":"content_block_delta","delta":{"type":"text_delta","text":"hello"}}\n')
    )
    mockProc.emit("close", 0)

    await promise
    expect(chunks).toContain("hello")
  })

  it("resolves on exit code 0", async () => {
    const runner = new GstackRunner()
    const promise = runner.run("office-hours", "task", () => {})
    mockProc.emit("close", 0)
    await expect(promise).resolves.toBeUndefined()
  })

  it("rejects on non-zero exit code", async () => {
    const runner = new GstackRunner()
    const promise = runner.run("office-hours", "task", () => {})
    mockProc.emit("close", 1)
    await expect(promise).rejects.toThrow("exit code 1")
  })

  it("abort() kills the subprocess", () => {
    const runner = new GstackRunner()
    runner.run("office-hours", "task", () => {})
    runner.abort()
    expect(mockProc.kill).toHaveBeenCalled()
  })
})
