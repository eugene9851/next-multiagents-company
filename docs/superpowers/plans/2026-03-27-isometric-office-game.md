# Isometric Office Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6명의 AI 에이전트가 React Three Fiber 3D 오피스에서 두 발로 걸어다니며 실제 gstack(claude CLI) 커맨드를 실행하는 게임형 UI를 구현한다.

**Architecture:** Next.js 16 (App Router) + React Three Fiber로 3D 아이소메트릭 오피스를 렌더링한다. Node.js TypeScript 백엔드가 WebSocket으로 프론트엔드와 통신하며, claude CLI subprocess를 순서대로 실행해 gstack 슬래시 커맨드를 처리한다. 각 에이전트는 procedural Three.js geometry(구체 머리 + 박스 몸통 + 실린더 팔다리)로 만든 3D 캐릭터로 표현되고, useFrame으로 걷기/대기/작업 애니메이션이 적용된다.

**Tech Stack:** Next.js 16, React 19, @react-three/fiber, @react-three/drei, three.js, Node.js TypeScript, Express, ws, claude CLI (gstack)

---

## File Map

### 삭제 (기존 파일)
- `frontend/components/AgentDot.tsx`
- `frontend/components/OfficeMap.tsx`
- `frontend/components/TopBar.tsx`
- `frontend/components/Sidebar.tsx`
- `frontend/components/TaskPanel.tsx`
- `frontend/components/AgentStatusList.tsx`
- `frontend/components/ActivityLog.tsx`
- `frontend/components/SpeechBubble.tsx`
- `frontend/hooks/useAgentStore.ts`
- `backend/main.py`
- `backend/sim_engine.py`
- `backend/agents.py`

### 생성 (Frontend)
- `frontend/types/agent.ts` — 공유 타입 (AgentState, AgentEvent, RoomDef)
- `frontend/hooks/useOfficeSocket.ts` — WebSocket 연결 + 에이전트 상태 관리
- `frontend/components/OfficeCanvas.tsx` — R3F Canvas 래퍼 (카메라, 조명, dynamic import용 진입점)
- `frontend/components/RoomGroup.tsx` — 6개 방 3D mesh 배치
- `frontend/components/AgentCharacter.tsx` — procedural 3D 캐릭터 + 걷기 애니메이션
- `frontend/components/SpeechBubble.tsx` — R3F Html 말풍선
- `frontend/components/Sidebar.tsx` — 우측 패널 컨테이너
- `frontend/components/TaskInput.tsx` — CEO 태스크 입력
- `frontend/components/AgentStatusList.tsx` — 팀 현황 리스트
- `frontend/components/OutputPanel.tsx` — gstack 출력 스트리밍
- `frontend/components/ActivityLog.tsx` — 이벤트 로그
- `frontend/app/page.tsx` — 루트 페이지 (기존 교체)

### 생성 (Backend)
- `backend/package.json` — Node.js 의존성
- `backend/tsconfig.json` — TypeScript 설정
- `backend/types.ts` — 백엔드 공유 타입
- `backend/agents.ts` — 에이전트 레지스트리 + 방 좌표 (기존 Python 대체)
- `backend/server.ts` — Express + WebSocket 서버
- `backend/gstackRunner.ts` — claude CLI subprocess 실행 + 스트리밍
- `backend/flowOrchestrator.ts` — 에이전트 실행 순서 조율

### 생성 (Tests)
- `backend/tests/agents.test.ts`
- `backend/tests/gstackRunner.test.ts`
- `backend/tests/flowOrchestrator.test.ts`
- `frontend/__tests__/useOfficeSocket.test.ts`

---

## Task 1: 기존 파일 삭제 + 의존성 설치

**Files:**
- Delete: `frontend/components/AgentDot.tsx`, `OfficeMap.tsx`, `TopBar.tsx`, `Sidebar.tsx`, `TaskPanel.tsx`, `AgentStatusList.tsx`, `ActivityLog.tsx`, `SpeechBubble.tsx`
- Delete: `frontend/hooks/useAgentStore.ts`
- Delete: `backend/main.py`, `backend/sim_engine.py`, `backend/agents.py`

- [ ] **Step 1: 기존 frontend 컴포넌트 삭제**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/frontend
rm components/AgentDot.tsx components/OfficeMap.tsx components/TopBar.tsx
rm components/Sidebar.tsx components/TaskPanel.tsx components/AgentStatusList.tsx
rm components/ActivityLog.tsx components/SpeechBubble.tsx
rm hooks/useAgentStore.ts
```

- [ ] **Step 2: 기존 Python 백엔드 파일 삭제**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
rm main.py sim_engine.py agents.py
# __pycache__와 requirements.txt는 유지해도 무관, 나중에 정리
```

- [ ] **Step 3: R3F 의존성 설치**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/frontend
npm install @react-three/fiber @react-three/drei three
npm install --save-dev @types/three
```

Expected output: `added N packages` (no peer dependency errors)

- [ ] **Step 4: gstack 설치 (없을 경우)**

```bash
# gstack이 설치되어 있는지 확인
ls ~/.claude/skills/gstack 2>/dev/null && echo "gstack found" || echo "gstack not found"

# 없으면 설치
if [ ! -d ~/.claude/skills/gstack ]; then
  git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
  cd ~/.claude/skills/gstack && ./setup
fi
```

- [ ] **Step 5: Backend package.json 생성**

`backend/package.json` 파일을 생성한다:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node server.ts",
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "@types/ws": "^8.5.10",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 6: Backend tsconfig.json 생성**

`backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 7: Backend 의존성 설치**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npm install
```

- [ ] **Step 8: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add -A
git commit -m "chore: clean slate — remove old components, install R3F + backend deps"
```

---

## Task 2: 공유 타입 정의

**Files:**
- Create: `frontend/types/agent.ts`
- Create: `backend/types.ts`

- [ ] **Step 1: frontend/types/agent.ts 작성**

기존 파일을 완전히 교체한다:

```ts
// frontend/types/agent.ts

export type AgentId = "ceo" | "pm" | "designer" | "dev" | "qa" | "devops"

export type AgentStatus = "idle" | "moving" | "running" | "done" | "error"

export type AnimState = "idle" | "walk" | "work"

export interface RoomDef {
  id: string
  label: string
  position: [number, number, number]  // [x, y, z] in 3D world units
  color: string                        // hex, used for room floor glow
}

export interface AgentDef {
  id: AgentId
  role: string
  color: string          // hex color for character body
  homeRoom: string       // room id
  gstackSkill: string    // skill name passed to gstackRunner
}

export interface AgentState {
  id: AgentId
  status: AgentStatus
  animState: AnimState
  room: string           // current room id
  targetRoom: string     // room id the agent is moving to (same as room if not moving)
  message: string        // speech bubble text
}

// WebSocket: server → client
export interface AgentEvent {
  type: "agent_update" | "stream_chunk" | "agent_done" | "flow_complete" | "error"
  agentId: AgentId
  status: AgentStatus
  animState: AnimState
  room: string
  message: string
  chunk?: string         // only for stream_chunk events
  errorMsg?: string      // only for error events
}

// WebSocket: client → server
export interface StartTaskMessage {
  type: "start_task"
  description: string
}
```

- [ ] **Step 2: backend/types.ts 작성**

```ts
// backend/types.ts

export type AgentId = "ceo" | "pm" | "designer" | "dev" | "qa" | "devops"

export type AgentStatus = "idle" | "moving" | "running" | "done" | "error"

export type AnimState = "idle" | "walk" | "work"

export interface AgentEvent {
  type: "agent_update" | "stream_chunk" | "agent_done" | "flow_complete" | "error"
  agentId: AgentId
  status: AgentStatus
  animState: AnimState
  room: string
  message: string
  chunk?: string
  errorMsg?: string
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/types/agent.ts backend/types.ts
git commit -m "feat: add shared types for agents and WebSocket events"
```

---

## Task 3: Backend — agents.ts + server.ts

**Files:**
- Create: `backend/agents.ts`
- Create: `backend/server.ts`
- Create: `backend/tests/agents.test.ts`

- [ ] **Step 1: 테스트 먼저 작성 (agents.test.ts)**

```ts
// backend/tests/agents.test.ts
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
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx vitest run tests/agents.test.ts 2>&1 | tail -10
```

Expected: `Cannot find module '../agents'` 에러

- [ ] **Step 3: backend/agents.ts 작성**

```ts
// backend/agents.ts
import type { AgentId } from "./types"

export interface AgentDef {
  id: AgentId
  role: string
  color: string
  homeRoom: string
  gstackSkill: string
}

export interface RoomDef {
  id: string
  label: string
  position: [number, number, number]
}

export const ROOMS: RoomDef[] = [
  { id: "ceo_office", label: "CEO 오피스", position: [0,   0, -8] },
  { id: "pm_zone",    label: "PM 존",     position: [-6,  0, -4] },
  { id: "meeting",    label: "미팅룸",    position: [0,   0,  0] },
  { id: "dev_zone",   label: "Dev 존",    position: [6,   0, -4] },
  { id: "qa_zone",    label: "QA 존",     position: [-6,  0,  4] },
  { id: "design_zone",label: "Design 존", position: [6,   0,  4] },
  { id: "devops_zone",label: "DevOps 존", position: [0,   0,  8] },
]

export const AGENTS: AgentDef[] = [
  { id: "ceo",      role: "CEO",      color: "#eab308", homeRoom: "ceo_office",  gstackSkill: "plan-ceo-review" },
  { id: "pm",       role: "PM",       color: "#6366f1", homeRoom: "pm_zone",     gstackSkill: "office-hours" },
  { id: "designer", role: "Designer", color: "#22c55e", homeRoom: "design_zone", gstackSkill: "plan-design-review" },
  { id: "dev",      role: "Dev",      color: "#0ea5e9", homeRoom: "dev_zone",    gstackSkill: "plan-eng-review" },
  { id: "qa",       role: "QA",       color: "#a855f7", homeRoom: "qa_zone",     gstackSkill: "qa" },
  { id: "devops",   role: "DevOps",   color: "#f97316", homeRoom: "devops_zone", gstackSkill: "ship" },
]

export function getAgentDef(id: string): AgentDef | undefined {
  return AGENTS.find(a => a.id === id)
}

export function getRoomPosition(roomId: string): [number, number, number] {
  return ROOMS.find(r => r.id === roomId)?.position ?? [0, 0, 0]
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx vitest run tests/agents.test.ts
```

Expected: `Tests  4 passed`

- [ ] **Step 5: backend/server.ts 작성**

```ts
// backend/server.ts
import express from "express"
import { WebSocketServer, WebSocket } from "ws"
import { createServer } from "http"
import { AGENTS, ROOMS } from "./agents"
import { FlowOrchestrator } from "./flowOrchestrator"
import type { AgentEvent } from "./types"

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

const PORT = 3001

// Active WebSocket clients
const clients = new Set<WebSocket>()

function broadcast(event: AgentEvent) {
  const msg = JSON.stringify(event)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  }
}

const orchestrator = new FlowOrchestrator(broadcast)

app.get("/health", (_req, res) => {
  res.json({ status: "ok", agents: AGENTS.length, rooms: ROOMS.length })
})

wss.on("connection", (ws) => {
  clients.add(ws)

  // 연결 직후 모든 에이전트 초기 상태 전송
  for (const agent of AGENTS) {
    const event: AgentEvent = {
      type: "agent_update",
      agentId: agent.id,
      status: "idle",
      animState: "idle",
      room: agent.homeRoom,
      message: "",
    }
    ws.send(JSON.stringify(event))
  }

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === "start_task" && typeof msg.description === "string") {
        orchestrator.run(msg.description).catch(console.error)
      }
    } catch {
      // ignore malformed messages
    }
  })

  ws.on("close", () => clients.delete(ws))
  ws.on("error", () => clients.delete(ws))
})

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
```

- [ ] **Step 6: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add backend/agents.ts backend/server.ts backend/tests/agents.test.ts
git commit -m "feat(backend): agents registry + WebSocket server"
```

---

## Task 4: Backend — gstackRunner.ts

**Files:**
- Create: `backend/gstackRunner.ts`
- Create: `backend/tests/gstackRunner.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

```ts
// backend/tests/gstackRunner.test.ts
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
  })

  it("calls onChunk with streamed text", async () => {
    const chunks: string[] = []
    const runner = new GstackRunner()

    const promise = runner.run("office-hours", "로그인 기능 구현", (chunk) => {
      chunks.push(chunk)
    })

    // 스트림 데이터 시뮬레이션
    mockProc.stdout.emit("data", Buffer.from('{"type":"assistant","message":{"content":[{"type":"text","text":"분석중..."}]}}\n'))
    mockProc.emit("close", 0)

    await promise
    expect(chunks).toContain("분석중...")
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
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx vitest run tests/gstackRunner.test.ts 2>&1 | tail -10
```

Expected: `Cannot find module '../gstackRunner'`

- [ ] **Step 3: backend/gstackRunner.ts 작성**

```ts
// backend/gstackRunner.ts
import { spawn, ChildProcess } from "child_process"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"

// gstack 스킬 파일을 찾아 내용 반환. 없으면 fallback 프롬프트 사용.
function getSkillPrompt(skillName: string): string {
  const skillBase = join(homedir(), ".claude", "skills", "gstack")

  // gstack 설치 경로 탐색
  const candidates = [
    join(skillBase, "skills", skillName, "SKILL.md"),
    join(skillBase, "skills", `${skillName}.md`),
    join(skillBase, `${skillName}.md`),
  ]

  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf-8")
    }
  }

  return FALLBACK_PROMPTS[skillName] ?? ""
}

const FALLBACK_PROMPTS: Record<string, string> = {
  "office-hours": `You are a product discovery expert conducting office hours.
Your job: deeply understand the task requirements, identify ambiguities, define scope, and produce a clear product brief.
Be thorough but concise. Output a structured brief with: Goal, User Stories, Scope, and Open Questions.`,

  "plan-ceo-review": `You are a CEO reviewing a product plan from a business perspective.
Evaluate: business value, market fit, strategic risks, resource requirements.
Output: Go/No-Go decision with clear rationale, key concerns, and suggested pivots if any.`,

  "plan-eng-review": `You are a senior software engineer reviewing a technical implementation plan.
Evaluate: architecture soundness, scalability, complexity, implementation risks, test strategy.
Output: Technical assessment with recommended approach, potential blockers, and estimated complexity.`,

  "plan-design-review": `You are a senior product designer reviewing a feature plan.
Evaluate: UX flow, user needs, accessibility, design patterns, edge cases in the UI.
Output: Design assessment with wireframe descriptions, UX recommendations, and design risks.`,

  "qa": `You are a QA engineer writing a comprehensive test plan.
Cover: happy paths, edge cases, error scenarios, accessibility, performance.
Output: Structured test cases with steps, expected results, and severity ratings.`,

  "ship": `You are a DevOps/release engineer preparing for deployment.
Cover: pre-deploy checklist, staging steps, monitoring checks, rollback plan, PR description.
Output: Structured deployment runbook ready to follow step-by-step.`,
}

export class GstackRunner {
  private currentProc: ChildProcess | null = null

  run(
    skillName: string,
    taskDescription: string,
    onChunk: (text: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const skillPrompt = getSkillPrompt(skillName)

      const args: string[] = [
        "--print",
        "--dangerously-skip-permissions",
        "--output-format", "stream-json",
      ]

      if (skillPrompt) {
        args.push("--append-system-prompt", skillPrompt)
      }

      args.push("-p", `Task: ${taskDescription}`)

      const proc = spawn("claude", args)
      this.currentProc = proc

      let buffer = ""

      proc.stdout.on("data", (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""  // 마지막 불완전한 라인은 버퍼에 유지

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const evt = JSON.parse(line)
            // stream-json 포맷에서 텍스트 청크 추출
            if (evt.type === "assistant" && Array.isArray(evt.message?.content)) {
              for (const block of evt.message.content) {
                if (block.type === "text" && block.text) {
                  onChunk(block.text)
                }
              }
            }
            // content_block_delta 포맷 (스트리밍)
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              onChunk(evt.delta.text)
            }
          } catch {
            // JSON 파싱 실패 시 raw 텍스트로 전달
            if (line.trim()) onChunk(line)
          }
        }
      })

      proc.on("close", (code) => {
        this.currentProc = null
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`claude CLI exited with exit code ${code}`))
        }
      })

      proc.on("error", (err) => {
        this.currentProc = null
        reject(new Error(`Failed to spawn claude CLI: ${err.message}`))
      })
    })
  }

  abort() {
    this.currentProc?.kill()
    this.currentProc = null
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx vitest run tests/gstackRunner.test.ts
```

Expected: `Tests  3 passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add backend/gstackRunner.ts backend/tests/gstackRunner.test.ts
git commit -m "feat(backend): gstack runner — claude CLI subprocess + stream-json parsing"
```

---

## Task 5: Backend — flowOrchestrator.ts

**Files:**
- Create: `backend/flowOrchestrator.ts`
- Create: `backend/tests/flowOrchestrator.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

```ts
// backend/tests/flowOrchestrator.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { FlowOrchestrator, PIPELINE } from "../flowOrchestrator"
import type { AgentEvent } from "../types"

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
    events = []
    broadcast = (e) => events.push(e)
  })

  it("broadcasts agent_update with moving status before running", async () => {
    // GstackRunner mock
    vi.mock("../gstackRunner", () => ({
      GstackRunner: vi.fn().mockImplementation(() => ({
        run: vi.fn().mockResolvedValue(undefined),
        abort: vi.fn(),
      })),
    }))

    const orch = new FlowOrchestrator(broadcast)
    await orch.run("test task")

    const movingEvents = events.filter(e => e.status === "moving")
    expect(movingEvents.length).toBeGreaterThan(0)
  })

  it("broadcasts flow_complete at end", async () => {
    const orch = new FlowOrchestrator(broadcast)
    await orch.run("test task")

    const doneEvent = events.find(e => e.type === "flow_complete")
    expect(doneEvent).toBeDefined()
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx vitest run tests/flowOrchestrator.test.ts 2>&1 | tail -10
```

Expected: `Cannot find module '../flowOrchestrator'`

- [ ] **Step 3: backend/flowOrchestrator.ts 작성**

```ts
// backend/flowOrchestrator.ts
import { GstackRunner } from "./gstackRunner"
import { AGENTS, getRoomPosition } from "./agents"
import type { AgentEvent, AgentId } from "./types"

export interface PipelineStep {
  agentId: AgentId
  targetRoom: string
  workMessage: string     // 말풍선에 표시될 짧은 메시지
}

// CEO → PM → Designer → Dev → QA → DevOps 파이프라인
// CEO는 plan-ceo-review를 수행하고, 나머지가 순서대로 실행됨
export const PIPELINE: PipelineStep[] = [
  { agentId: "pm",       targetRoom: "pm_zone",     workMessage: "/office-hours 실행 중..." },
  { agentId: "ceo",      targetRoom: "ceo_office",   workMessage: "/plan-ceo-review 중..." },
  { agentId: "designer", targetRoom: "design_zone",  workMessage: "/plan-design-review 중..." },
  { agentId: "dev",      targetRoom: "dev_zone",     workMessage: "/plan-eng-review + 빌드 중..." },
  { agentId: "qa",       targetRoom: "qa_zone",      workMessage: "/qa 테스트 실행 중..." },
  { agentId: "devops",   targetRoom: "devops_zone",  workMessage: "/ship 배포 준비 중..." },
]

const MOVE_DELAY_MS = 800   // 이동 애니메이션 대기

export class FlowOrchestrator {
  private broadcast: (event: AgentEvent) => void
  private runner: GstackRunner
  private running = false

  constructor(broadcast: (event: AgentEvent) => void) {
    this.broadcast = broadcast
    this.runner = new GstackRunner()
  }

  async run(taskDescription: string): Promise<void> {
    if (this.running) return
    this.running = true

    try {
      for (const step of PIPELINE) {
        await this.executeStep(step, taskDescription)
      }

      this.broadcast({
        type: "flow_complete",
        agentId: "devops",
        status: "done",
        animState: "idle",
        room: "devops_zone",
        message: "✅ 파이프라인 완료!",
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.broadcast({
        type: "error",
        agentId: "devops",
        status: "error",
        animState: "idle",
        room: "devops_zone",
        message: `오류: ${msg}`,
        errorMsg: msg,
      })
    } finally {
      this.running = false

      // 모든 에이전트를 idle로 리셋
      for (const agent of AGENTS) {
        setTimeout(() => {
          this.broadcast({
            type: "agent_update",
            agentId: agent.id,
            status: "idle",
            animState: "idle",
            room: agent.homeRoom,
            message: "",
          })
        }, 2000)
      }
    }
  }

  private async executeStep(step: PipelineStep, taskDescription: string): Promise<void> {
    // 1. 이동 시작 알림
    this.broadcast({
      type: "agent_update",
      agentId: step.agentId,
      status: "moving",
      animState: "walk",
      room: step.targetRoom,
      message: `${step.targetRoom}으로 이동 중...`,
    })

    // 이동 애니메이션 대기
    await delay(MOVE_DELAY_MS)

    // 2. 작업 시작 알림
    this.broadcast({
      type: "agent_update",
      agentId: step.agentId,
      status: "running",
      animState: "work",
      room: step.targetRoom,
      message: step.workMessage,
    })

    // 3. gstack 스킬 실행 (스트리밍)
    const agentDef = AGENTS.find(a => a.id === step.agentId)!

    await this.runner.run(
      agentDef.gstackSkill,
      taskDescription,
      (chunk) => {
        // 청크를 프론트엔드로 스트리밍
        this.broadcast({
          type: "stream_chunk",
          agentId: step.agentId,
          status: "running",
          animState: "work",
          room: step.targetRoom,
          message: step.workMessage,
          chunk,
        })
      }
    )

    // 4. 완료 알림
    this.broadcast({
      type: "agent_done",
      agentId: step.agentId,
      status: "done",
      animState: "idle",
      room: step.targetRoom,
      message: "✓ 완료",
    })

    await delay(500)
  }

  abort() {
    this.runner.abort()
    this.running = false
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx vitest run tests/flowOrchestrator.test.ts
```

Expected: `Tests  4 passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add backend/flowOrchestrator.ts backend/tests/flowOrchestrator.test.ts
git commit -m "feat(backend): flow orchestrator — sequential gstack pipeline"
```

---

## Task 6: Frontend — useOfficeSocket.ts

**Files:**
- Create: `frontend/hooks/useOfficeSocket.ts`
- Modify: `frontend/__tests__/useOfficeSocket.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

```ts
// frontend/__tests__/useOfficeSocket.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useOfficeSocket } from "../hooks/useOfficeSocket"
import type { AgentEvent } from "../types/agent"

// WebSocket mock
class MockWebSocket extends EventTarget {
  readyState = 1 // OPEN
  sent: string[] = []
  static instances: MockWebSocket[] = []

  constructor(public url: string) {
    super()
    MockWebSocket.instances.push(this)
  }

  send(data: string) { this.sent.push(data) }
  close() { this.readyState = 3 }

  simulateMessage(event: AgentEvent) {
    this.dispatchEvent(Object.assign(new Event("message"), { data: JSON.stringify(event) }))
  }
}

vi.stubGlobal("WebSocket", MockWebSocket)

const PM_UPDATE: AgentEvent = {
  type: "agent_update",
  agentId: "pm",
  status: "running",
  animState: "work",
  room: "pm_zone",
  message: "분석 중...",
}

describe("useOfficeSocket", () => {
  beforeEach(() => { MockWebSocket.instances = [] })

  it("initializes with 6 idle agents", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    expect(Object.keys(result.current.agents)).toHaveLength(6)
    for (const state of Object.values(result.current.agents)) {
      expect(state.status).toBe("idle")
    }
  })

  it("updates agent state on AgentEvent message", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    const ws = MockWebSocket.instances[0]

    act(() => ws.simulateMessage(PM_UPDATE))

    expect(result.current.agents["pm"].status).toBe("running")
    expect(result.current.agents["pm"].message).toBe("분석 중...")
  })

  it("appends chunk to outputChunks on stream_chunk", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    const ws = MockWebSocket.instances[0]

    act(() => ws.simulateMessage({ ...PM_UPDATE, type: "stream_chunk", chunk: "hello " }))
    act(() => ws.simulateMessage({ ...PM_UPDATE, type: "stream_chunk", chunk: "world" }))

    expect(result.current.outputChunks["pm"]).toBe("hello world")
  })

  it("sendTask sends JSON to WebSocket", () => {
    const { result } = renderHook(() => useOfficeSocket("ws://localhost:3001"))
    const ws = MockWebSocket.instances[0]

    act(() => result.current.sendTask("로그인 기능"))

    expect(ws.sent).toHaveLength(1)
    expect(JSON.parse(ws.sent[0])).toEqual({ type: "start_task", description: "로그인 기능" })
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/frontend
npx vitest run __tests__/useOfficeSocket.test.ts 2>&1 | tail -10
```

Expected: `Cannot find module '../hooks/useOfficeSocket'`

- [ ] **Step 3: frontend/hooks/useOfficeSocket.ts 작성**

```ts
// frontend/hooks/useOfficeSocket.ts
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { AgentEvent, AgentId, AgentState } from "@/types/agent"
import { AGENT_DEFS, ROOM_DEFS } from "@/constants/office"

function buildInitialAgents(): Record<string, AgentState> {
  const result: Record<string, AgentState> = {}
  for (const def of AGENT_DEFS) {
    result[def.id] = {
      id: def.id,
      status: "idle",
      animState: "idle",
      room: def.homeRoom,
      targetRoom: def.homeRoom,
      message: "",
    }
  }
  return result
}

export interface OfficeSocketState {
  agents: Record<string, AgentState>
  outputChunks: Record<string, string>
  log: Array<{ time: string; agentId: string; message: string }>
  selectedAgent: AgentId | null
  connected: boolean
  sendTask: (description: string) => void
  selectAgent: (id: AgentId | null) => void
}

export function useOfficeSocket(url: string): OfficeSocketState {
  const [agents, setAgents] = useState<Record<string, AgentState>>(buildInitialAgents)
  const [outputChunks, setOutputChunks] = useState<Record<string, string>>({})
  const [log, setLog] = useState<Array<{ time: string; agentId: string; message: string }>>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout>

    function connect() {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onclose = () => {
        setConnected(false)
        retryTimer = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        // onerror는 onclose 전에 발생. onclose에서 재연결 처리.
      }

      ws.onmessage = (evt: MessageEvent) => {
        try {
          const event: AgentEvent = JSON.parse(evt.data)
          handleEvent(event)
        } catch {
          // ignore
        }
      }
    }

    connect()
    return () => {
      clearTimeout(retryTimer)
      wsRef.current?.close()
    }
  }, [url])

  function handleEvent(event: AgentEvent) {
    if (event.type === "stream_chunk" && event.chunk) {
      setOutputChunks(prev => ({
        ...prev,
        [event.agentId]: (prev[event.agentId] ?? "") + event.chunk,
      }))
      return
    }

    // agent_update / agent_done / flow_complete / error
    setAgents(prev => ({
      ...prev,
      [event.agentId]: {
        id: event.agentId,
        status: event.status,
        animState: event.animState,
        room: event.room,
        targetRoom: event.room,
        message: event.message,
      },
    }))

    if (event.message) {
      const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      setLog(prev => [{ time, agentId: event.agentId, message: event.message }, ...prev].slice(0, 100))
    }

    // flow_complete: output 초기화
    if (event.type === "flow_complete") {
      setOutputChunks({})
    }
  }

  const sendTask = useCallback((description: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "start_task", description }))
    }
  }, [])

  const selectAgent = useCallback((id: AgentId | null) => {
    setSelectedAgent(id)
  }, [])

  return { agents, outputChunks, log, selectedAgent, connected, sendTask, selectAgent }
}
```

- [ ] **Step 4: frontend/constants/office.ts 생성**

hook에서 import하는 constants 파일:

```ts
// frontend/constants/office.ts
import type { AgentDef, RoomDef } from "@/types/agent"

export const ROOM_DEFS: RoomDef[] = [
  { id: "ceo_office",  label: "CEO 오피스", position: [0,   0, -8], color: "#eab308" },
  { id: "pm_zone",     label: "PM 존",      position: [-6,  0, -4], color: "#6366f1" },
  { id: "meeting",     label: "미팅룸",     position: [0,   0,  0], color: "#64748b" },
  { id: "dev_zone",    label: "Dev 존",     position: [6,   0, -4], color: "#0ea5e9" },
  { id: "qa_zone",     label: "QA 존",      position: [-6,  0,  4], color: "#a855f7" },
  { id: "design_zone", label: "Design 존",  position: [6,   0,  4], color: "#22c55e" },
  { id: "devops_zone", label: "DevOps 존",  position: [0,   0,  8], color: "#f97316" },
]

export const AGENT_DEFS: AgentDef[] = [
  { id: "ceo",      role: "CEO",      color: "#eab308", homeRoom: "ceo_office",  gstackSkill: "plan-ceo-review" },
  { id: "pm",       role: "PM",       color: "#6366f1", homeRoom: "pm_zone",     gstackSkill: "office-hours" },
  { id: "designer", role: "Designer", color: "#22c55e", homeRoom: "design_zone", gstackSkill: "plan-design-review" },
  { id: "dev",      role: "Dev",      color: "#0ea5e9", homeRoom: "dev_zone",    gstackSkill: "plan-eng-review" },
  { id: "qa",       role: "QA",       color: "#a855f7", homeRoom: "qa_zone",     gstackSkill: "qa" },
  { id: "devops",   role: "DevOps",   color: "#f97316", homeRoom: "devops_zone", gstackSkill: "ship" },
]

export function getRoomPosition(roomId: string): [number, number, number] {
  return ROOM_DEFS.find(r => r.id === roomId)?.position ?? [0, 0, 0]
}

export function getRoomColor(roomId: string): string {
  return ROOM_DEFS.find(r => r.id === roomId)?.color ?? "#334155"
}

export function getAgentDef(id: string): AgentDef | undefined {
  return AGENT_DEFS.find(a => a.id === id)
}
```

- [ ] **Step 5: types/agent.ts에 AgentDef 추가**

기존 `frontend/types/agent.ts`에 `AgentDef` 인터페이스가 없으므로 추가:

```ts
// frontend/types/agent.ts 에 추가 (파일 끝에)

export interface AgentDef {
  id: AgentId
  role: string
  color: string
  homeRoom: string
  gstackSkill: string
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/frontend
npx vitest run __tests__/useOfficeSocket.test.ts
```

Expected: `Tests  4 passed`

- [ ] **Step 7: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/hooks/useOfficeSocket.ts frontend/constants/office.ts frontend/types/agent.ts frontend/__tests__/useOfficeSocket.test.ts
git commit -m "feat(frontend): useOfficeSocket hook + office constants"
```

---

## Task 7: Frontend 3D — OfficeCanvas + RoomGroup

**Files:**
- Create: `frontend/components/OfficeCanvas.tsx`
- Create: `frontend/components/RoomGroup.tsx`

> R3F 컴포넌트는 시각적 렌더링이므로 단위 테스트 대신 동작 검증으로 대체한다.

- [ ] **Step 1: frontend/components/RoomGroup.tsx 작성**

```tsx
// frontend/components/RoomGroup.tsx
"use client"

import { useRef } from "react"
import { Mesh, Color } from "three"
import { Text } from "@react-three/drei"
import { ROOM_DEFS } from "@/constants/office"

interface RoomGroupProps {
  activeRooms: Set<string>       // 현재 에이전트가 있는 방 ids
  onRoomClick: (roomId: string) => void
}

function RoomTile({
  room,
  isActive,
  onClick,
}: {
  room: (typeof ROOM_DEFS)[0]
  isActive: boolean
  onClick: () => void
}) {
  const meshRef = useRef<Mesh>(null)
  const [x, y, z] = room.position
  const baseColor = new Color(room.color)
  const floorColor = isActive ? baseColor.clone().multiplyScalar(1.4) : baseColor.clone().multiplyScalar(0.25)

  return (
    <group position={[x, y, z]} onClick={onClick}>
      {/* 바닥 타일 */}
      <mesh ref={meshRef} position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[4.5, 0.1, 4.5]} />
        <meshStandardMaterial
          color={floorColor}
          emissive={isActive ? room.color : "#000000"}
          emissiveIntensity={isActive ? 0.3 : 0}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 낮은 벽 (테두리) */}
      {[
        { pos: [0, 0.25, -2.3] as [number,number,number], size: [4.5, 0.5, 0.1] as [number,number,number] },
        { pos: [0, 0.25, 2.3]  as [number,number,number], size: [4.5, 0.5, 0.1] as [number,number,number] },
        { pos: [-2.3, 0.25, 0] as [number,number,number], size: [0.1, 0.5, 4.5] as [number,number,number] },
        { pos: [2.3, 0.25, 0]  as [number,number,number], size: [0.1, 0.5, 4.5] as [number,number,number] },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={room.color} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* 방 라벨 */}
      <Text
        position={[0, 0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color={isActive ? "#ffffff" : room.color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {room.label}
      </Text>
    </group>
  )
}

export function RoomGroup({ activeRooms, onRoomClick }: RoomGroupProps) {
  return (
    <group>
      {/* 전체 바닥 */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[22, 0.1, 22]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* 바닥 그리드 */}
      <gridHelper args={[22, 22, "#1e293b", "#1e293b"]} position={[0, 0, 0]} />

      {/* 개별 방 타일 */}
      {ROOM_DEFS.map(room => (
        <RoomTile
          key={room.id}
          room={room}
          isActive={activeRooms.has(room.id)}
          onClick={() => onRoomClick(room.id)}
        />
      ))}
    </group>
  )
}
```

- [ ] **Step 2: frontend/components/OfficeCanvas.tsx 작성**

```tsx
// frontend/components/OfficeCanvas.tsx
"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { RoomGroup } from "./RoomGroup"
import { AgentCharacter } from "./AgentCharacter"
import { AGENT_DEFS, ROOM_DEFS, getRoomPosition } from "@/constants/office"
import type { AgentState, AgentId } from "@/types/agent"

interface OfficeCanvasProps {
  agents: Record<string, AgentState>
  selectedAgent: AgentId | null
  onAgentClick: (id: AgentId) => void
  onRoomClick: (roomId: string) => void
}

// 현재 어떤 방들에 에이전트가 있는지
function getActiveRooms(agents: Record<string, AgentState>): Set<string> {
  const rooms = new Set<string>()
  for (const state of Object.values(agents)) {
    if (state.status !== "idle") {
      rooms.add(state.room)
    }
  }
  return rooms
}

export function OfficeCanvas({ agents, selectedAgent, onAgentClick, onRoomClick }: OfficeCanvasProps) {
  const activeRooms = getActiveRooms(agents)

  return (
    <Canvas
      shadows
      camera={{ position: [14, 14, 14], near: 0.1, far: 200 }}
      style={{ background: "#080810" }}
    >
      {/* 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 8, 0]} intensity={0.4} color="#6366f1" />

      {/* 카메라 컨트롤: 줌만 허용 */}
      <OrbitControls
        enablePan={false}
        enableRotate={false}
        minDistance={8}
        maxDistance={40}
        target={[0, 0, 0]}
      />

      {/* 방 그룹 */}
      <RoomGroup activeRooms={activeRooms} onRoomClick={onRoomClick} />

      {/* 에이전트 캐릭터 */}
      {AGENT_DEFS.map(def => {
        const state = agents[def.id]
        if (!state) return null
        const targetPos = getRoomPosition(state.room)

        return (
          <AgentCharacter
            key={def.id}
            agentId={def.id}
            role={def.role}
            color={def.color}
            targetPosition={targetPos}
            animState={state.animState}
            message={state.message}
            isSelected={selectedAgent === def.id}
            onClick={() => onAgentClick(def.id)}
          />
        )
      })}
    </Canvas>
  )
}
```

- [ ] **Step 3: Next.js에서 R3F Canvas SSR 비활성화 설정 확인**

`frontend/next.config.ts`가 이미 비어있으므로, page.tsx에서 dynamic import로 처리한다 (Task 10에서 수행). 이 단계는 확인만.

```bash
cat /Users/eugene/Desktop/next-multiagents-company/frontend/next.config.ts
```

Expected: 빈 설정 파일

- [ ] **Step 4: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/components/OfficeCanvas.tsx frontend/components/RoomGroup.tsx
git commit -m "feat(frontend): 3D office canvas + room tiles with glow effect"
```

---

## Task 8: Frontend 3D — AgentCharacter + SpeechBubble

**Files:**
- Create: `frontend/components/AgentCharacter.tsx`
- Create: `frontend/components/SpeechBubble.tsx`

- [ ] **Step 1: frontend/components/SpeechBubble.tsx 작성**

```tsx
// frontend/components/SpeechBubble.tsx
"use client"

import { Html } from "@react-three/drei"

interface SpeechBubbleProps {
  message: string
  color: string
}

export function SpeechBubble({ message, color }: SpeechBubbleProps) {
  if (!message) return null

  return (
    <Html
      position={[0, 2.4, 0]}
      center
      distanceFactor={8}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          background: "rgba(10,15,26,0.95)",
          border: `1px solid ${color}`,
          borderRadius: "8px",
          padding: "4px 10px",
          fontSize: "11px",
          color: color,
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          maxWidth: "180px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          backdropFilter: "blur(8px)",
          boxShadow: `0 0 12px ${color}33`,
        }}
      >
        {message}
        <span
          style={{
            display: "inline-block",
            width: "6px",
            animation: "blink 1s step-end infinite",
            marginLeft: "2px",
          }}
        >
          ▋
        </span>
      </div>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </Html>
  )
}
```

- [ ] **Step 2: frontend/components/AgentCharacter.tsx 작성**

```tsx
// frontend/components/AgentCharacter.tsx
"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Html, Billboard } from "@react-three/drei"
import { Group, Color, MeshStandardMaterial } from "three"
import { SpeechBubble } from "./SpeechBubble"
import type { AgentId, AnimState } from "@/types/agent"

interface AgentCharacterProps {
  agentId: AgentId
  role: string
  color: string
  targetPosition: [number, number, number]
  animState: AnimState
  message: string
  isSelected: boolean
  onClick: () => void
}

// 걷기 파라미터
const WALK_SPEED = 0.06     // 프레임당 이동량
const LEG_SWING = 0.5       // 다리 최대 회전각 (rad)
const ARM_SWING = 0.3       // 팔 최대 회전각
const BOB_AMP = 0.04        // 걸을 때 상하 진폭
const IDLE_BREATH = 0.015   // idle 호흡 진폭

export function AgentCharacter({
  agentId,
  role,
  color,
  targetPosition,
  animState,
  message,
  isSelected,
  onClick,
}: AgentCharacterProps) {
  const groupRef = useRef<Group>(null)
  const leftLegRef = useRef<Group>(null)
  const rightLegRef = useRef<Group>(null)
  const leftArmRef = useRef<Group>(null)
  const rightArmRef = useRef<Group>(null)
  const torsoRef = useRef<Group>(null)

  const posRef = useRef<[number, number, number]>([...targetPosition])

  // targetPosition이 바뀌면 posRef 업데이트 (lerp 시작점은 현재 위치)
  useEffect(() => {
    // 목표 위치만 업데이트 — 실제 이동은 useFrame에서 lerp
  }, [targetPosition])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // 위치 lerp (걷기 이동)
    const cur = posRef.current
    const dx = targetPosition[0] - cur[0]
    const dz = targetPosition[2] - cur[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const isMoving = dist > 0.05

    if (isMoving) {
      cur[0] += dx * WALK_SPEED
      cur[2] += dz * WALK_SPEED
      groupRef.current.position.set(cur[0], cur[1], cur[2])

      // 이동 방향으로 캐릭터 회전
      groupRef.current.rotation.y = Math.atan2(dx, dz)
    } else {
      groupRef.current.position.set(targetPosition[0], targetPosition[1], targetPosition[2])
      posRef.current = [...targetPosition]
    }

    // 애니메이션 상태에 따른 몸체 움직임
    if (animState === "walk" || isMoving) {
      // 다리 흔들기
      const legAngle = Math.sin(t * 8) * LEG_SWING
      if (leftLegRef.current) leftLegRef.current.rotation.x = legAngle
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legAngle

      // 팔 흔들기 (반대 방향)
      const armAngle = Math.sin(t * 8) * ARM_SWING
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armAngle
      if (rightArmRef.current) rightArmRef.current.rotation.x = armAngle

      // 상하 바운스
      if (torsoRef.current) {
        torsoRef.current.position.y = Math.abs(Math.sin(t * 8)) * BOB_AMP
      }
    } else if (animState === "work") {
      // 작업 중: 팔만 앞뒤로 움직임 (타이핑 제스처)
      const workAngle = Math.sin(t * 5) * 0.2 - 0.3
      if (leftArmRef.current) leftArmRef.current.rotation.x = workAngle
      if (rightArmRef.current) rightArmRef.current.rotation.x = workAngle

      // 다리는 정지
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0

      // 약간의 몸 흔들림
      if (torsoRef.current) {
        torsoRef.current.position.y = Math.sin(t * 2) * IDLE_BREATH
      }
    } else {
      // idle: 천천히 호흡
      const breathAngle = Math.sin(t * 1.5) * 0.05
      if (leftArmRef.current) leftArmRef.current.rotation.x = breathAngle
      if (rightArmRef.current) rightArmRef.current.rotation.x = breathAngle
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
      if (torsoRef.current) {
        torsoRef.current.position.y = Math.sin(t * 1.5) * IDLE_BREATH
      }
    }
  })

  const bodyColor = new Color(color)
  const skinColor = new Color("#fbbf24")
  const pantsColor = bodyColor.clone().multiplyScalar(0.6)
  const selectedScale = isSelected ? 1.15 : 1.0

  return (
    <group ref={groupRef} onClick={onClick} scale={selectedScale}>
      {/* 선택 시 바닥 하이라이트 링 */}
      {isSelected && (
        <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
      )}

      {/* 몸통 그룹 (호흡 애니메이션) */}
      <group ref={torsoRef}>
        {/* 머리 */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* 눈 (작은 점) */}
        <mesh position={[0.09, 1.65, 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.09, 1.65, 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* 몸통 */}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[0.38, 0.5, 0.2]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </mesh>

        {/* 왼팔 */}
        <group ref={leftArmRef} position={[-0.28, 1.25, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.7} />
          </mesh>
        </group>

        {/* 오른팔 */}
        <group ref={rightArmRef} position={[0.28, 1.25, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.7} />
          </mesh>
        </group>

        {/* 왼다리 */}
        <group ref={leftLegRef} position={[-0.12, 0.78, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.8} />
          </mesh>
        </group>

        {/* 오른다리 */}
        <group ref={rightLegRef} position={[0.12, 0.78, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* 이름 뱃지 (카메라 방향 고정) */}
      <Billboard position={[0, 2.0, 0]}>
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div style={{
            background: color,
            color: "#ffffff",
            fontSize: "9px",
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "4px",
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
            boxShadow: `0 2px 8px ${color}66`,
          }}>
            {role}
          </div>
        </Html>
      </Billboard>

      {/* 말풍선 */}
      <SpeechBubble message={message} color={color} />
    </group>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/components/AgentCharacter.tsx frontend/components/SpeechBubble.tsx
git commit -m "feat(frontend): 3D agent character with walk/work/idle animation + speech bubble"
```

---

## Task 9: Frontend — Sidebar 컴포넌트들

**Files:**
- Create: `frontend/components/TaskInput.tsx`
- Create: `frontend/components/AgentStatusList.tsx`
- Create: `frontend/components/OutputPanel.tsx`
- Create: `frontend/components/ActivityLog.tsx`
- Create: `frontend/components/Sidebar.tsx`

- [ ] **Step 1: frontend/components/TaskInput.tsx**

```tsx
// frontend/components/TaskInput.tsx
"use client"

import { useState } from "react"

interface TaskInputProps {
  onSubmit: (description: string) => void
  disabled: boolean
}

export function TaskInput({ onSubmit, disabled }: TaskInputProps) {
  const [value, setValue] = useState("")

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue("")
  }

  return (
    <div className="p-4 border-b border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        새 태스크 (CEO 지시)
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
        }}
        placeholder="예: 로그인 기능을 OAuth2로 구현해줘..."
        disabled={disabled}
        rows={3}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 font-mono resize-none outline-none focus:border-indigo-500 disabled:opacity-50 placeholder:text-slate-600"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="mt-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold py-2 rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {disabled ? "⏳ 실행 중..." : "▶ 팀에게 지시 (⌘Enter)"}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: frontend/components/AgentStatusList.tsx**

```tsx
// frontend/components/AgentStatusList.tsx
"use client"

import type { AgentState, AgentId } from "@/types/agent"
import { AGENT_DEFS } from "@/constants/office"

interface AgentStatusListProps {
  agents: Record<string, AgentState>
  selectedAgent: AgentId | null
  onSelect: (id: AgentId) => void
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  idle:    { label: "대기",    class: "bg-slate-800 text-slate-500" },
  moving:  { label: "이동 중", class: "bg-yellow-900/40 text-yellow-400" },
  running: { label: "● 실행 중", class: "bg-green-900/40 text-green-400" },
  done:    { label: "✓ 완료", class: "bg-blue-900/40 text-blue-400" },
  error:   { label: "✗ 오류", class: "bg-red-900/40 text-red-400" },
}

export function AgentStatusList({ agents, selectedAgent, onSelect }: AgentStatusListProps) {
  return (
    <div className="p-4 border-b border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">팀 현황</div>
      <div className="space-y-1">
        {AGENT_DEFS.map(def => {
          const state = agents[def.id]
          if (!state) return null
          const badge = STATUS_BADGE[state.status] ?? STATUS_BADGE.idle
          const isSelected = selectedAgent === def.id

          return (
            <button
              key={def.id}
              onClick={() => onSelect(def.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                isSelected ? "bg-slate-700" : "hover:bg-slate-800/60"
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${def.color}22`, border: `1px solid ${def.color}44` }}
              >
                <span style={{ filter: "saturate(0) brightness(2)" }}>
                  {def.role[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-200">{def.role}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                  {state.message || "대기 중"}
                </div>
              </div>
              <div className={`text-[9px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${badge.class}`}>
                {badge.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: frontend/components/OutputPanel.tsx**

```tsx
// frontend/components/OutputPanel.tsx
"use client"

import { useEffect, useRef } from "react"
import type { AgentId } from "@/types/agent"
import { AGENT_DEFS } from "@/constants/office"

interface OutputPanelProps {
  selectedAgent: AgentId | null
  outputChunks: Record<string, string>
}

export function OutputPanel({ selectedAgent, outputChunks }: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const agentDef = AGENT_DEFS.find(a => a.id === selectedAgent)
  const output = selectedAgent ? (outputChunks[selectedAgent] ?? "") : ""

  // 새 청크 도착 시 스크롤 하단으로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="p-4 border-b border-slate-800">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {agentDef ? (
          <span>
            <span style={{ color: agentDef.color }}>{agentDef.role}</span> 출력
          </span>
        ) : (
          "출력 (캐릭터 클릭하면 표시)"
        )}
      </div>
      <div
        ref={scrollRef}
        className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-36 overflow-y-auto"
      >
        {output ? (
          <pre className="text-[10px] text-cyan-300 font-mono whitespace-pre-wrap leading-relaxed">
            {output}
            <span className="animate-pulse">▋</span>
          </pre>
        ) : (
          <p className="text-[10px] text-slate-600 font-mono">
            {selectedAgent ? "아직 출력 없음" : "캐릭터를 클릭하면 해당 에이전트의 출력이 여기에 표시됩니다"}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: frontend/components/ActivityLog.tsx**

```tsx
// frontend/components/ActivityLog.tsx
"use client"

import { AGENT_DEFS } from "@/constants/office"

interface LogEntry {
  time: string
  agentId: string
  message: string
}

interface ActivityLogProps {
  log: LogEntry[]
}

export function ActivityLog({ log }: ActivityLogProps) {
  const getColor = (agentId: string) =>
    AGENT_DEFS.find(a => a.id === agentId)?.color ?? "#64748b"

  return (
    <div className="p-4 flex-1 overflow-hidden flex flex-col">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">활동 로그</div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {log.length === 0 ? (
          <p className="text-[10px] text-slate-600 font-mono">태스크를 시작하면 로그가 여기에 표시됩니다</p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="flex gap-2 text-[10px] font-mono border-b border-slate-900 pb-1">
              <span className="text-slate-600 flex-shrink-0">{entry.time}</span>
              <span className="font-bold flex-shrink-0" style={{ color: getColor(entry.agentId) }}>
                {AGENT_DEFS.find(a => a.id === entry.agentId)?.role ?? entry.agentId}
              </span>
              <span className="text-slate-400 truncate">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: frontend/components/Sidebar.tsx**

```tsx
// frontend/components/Sidebar.tsx
"use client"

import { TaskInput } from "./TaskInput"
import { AgentStatusList } from "./AgentStatusList"
import { OutputPanel } from "./OutputPanel"
import { ActivityLog } from "./ActivityLog"
import type { AgentState, AgentId } from "@/types/agent"

interface SidebarProps {
  agents: Record<string, AgentState>
  outputChunks: Record<string, string>
  log: Array<{ time: string; agentId: string; message: string }>
  selectedAgent: AgentId | null
  connected: boolean
  onTaskSubmit: (description: string) => void
  onSelectAgent: (id: AgentId) => void
}

function isRunning(agents: Record<string, AgentState>): boolean {
  return Object.values(agents).some(a => a.status === "running" || a.status === "moving")
}

export function Sidebar({
  agents,
  outputChunks,
  log,
  selectedAgent,
  connected,
  onTaskSubmit,
  onSelectAgent,
}: SidebarProps) {
  return (
    <div className="w-80 flex-shrink-0 bg-slate-900/80 border-l border-slate-800 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-sm font-bold text-indigo-400 tracking-widest">⚡ AI COMPANY</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`} />
          <span className="text-[10px] text-slate-500">{connected ? "연결됨" : "연결 중..."}</span>
        </div>
      </div>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <TaskInput onSubmit={onTaskSubmit} disabled={!connected || isRunning(agents)} />
        <AgentStatusList agents={agents} selectedAgent={selectedAgent} onSelect={onSelectAgent} />
        <OutputPanel selectedAgent={selectedAgent} outputChunks={outputChunks} />
        <ActivityLog log={log} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/components/TaskInput.tsx frontend/components/AgentStatusList.tsx frontend/components/OutputPanel.tsx frontend/components/ActivityLog.tsx frontend/components/Sidebar.tsx
git commit -m "feat(frontend): sidebar components — task input, agent status, output panel, activity log"
```

---

## Task 10: Frontend — page.tsx 연결 + globals.css

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: frontend/app/globals.css 업데이트**

```css
/* frontend/app/globals.css */
@import "tailwindcss";

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #080810;
  color: #e2e8f0;
}

/* Three.js canvas가 body를 차지하도록 */
canvas {
  display: block;
}

/* 스크롤바 스타일 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}
```

- [ ] **Step 2: frontend/app/page.tsx 교체**

```tsx
// frontend/app/page.tsx
"use client"

import dynamic from "next/dynamic"
import { Sidebar } from "@/components/Sidebar"
import { useOfficeSocket } from "@/hooks/useOfficeSocket"
import type { AgentId } from "@/types/agent"

// R3F Canvas는 SSR 비활성화 필수
const OfficeCanvas = dynamic(
  () => import("@/components/OfficeCanvas").then(m => m.OfficeCanvas),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#080810]">
      <p className="text-slate-600 font-mono text-sm">오피스 로딩 중...</p>
    </div>
  )}
)

const WS_URL = "ws://localhost:3001"

export default function Home() {
  const {
    agents,
    outputChunks,
    log,
    selectedAgent,
    connected,
    sendTask,
    selectAgent,
  } = useOfficeSocket(WS_URL)

  function handleAgentClick(id: AgentId) {
    selectAgent(id)
  }

  function handleRoomClick(roomId: string) {
    // 방 클릭 시 해당 방에 있는 에이전트 선택
    const agentInRoom = Object.values(agents).find(a => a.room === roomId)
    if (agentInRoom) selectAgent(agentInRoom.id)
  }

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* 3D 오피스 캔버스 */}
      <div style={{ flex: 1, position: "relative" }}>
        <OfficeCanvas
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentClick={handleAgentClick}
          onRoomClick={handleRoomClick}
        />
      </div>

      {/* 사이드바 */}
      <Sidebar
        agents={agents}
        outputChunks={outputChunks}
        log={log}
        selectedAgent={selectedAgent}
        connected={connected}
        onTaskSubmit={sendTask}
        onSelectAgent={selectAgent}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/app/page.tsx frontend/app/globals.css
git commit -m "feat(frontend): wire up page — R3F canvas + sidebar, SSR disabled for Canvas"
```

---

## Task 11: 통합 스모크 테스트

- [ ] **Step 1: 백엔드 시작**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx ts-node server.ts
```

Expected: `Backend running on http://localhost:3001`

- [ ] **Step 2: Health check**

새 터미널에서:
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","agents":6,"rooms":7}`

- [ ] **Step 3: 프론트엔드 시작**

```bash
cd /Users/eugene/Desktop/next-multiagents-company/frontend
npm run dev
```

Expected: `Ready in Xms` (no errors)

- [ ] **Step 4: 브라우저 확인**

`http://localhost:3000` 접속 후 확인:
- [ ] 3D 아이소메트릭 오피스 맵이 렌더링됨
- [ ] 6개 방(CEO 오피스, PM 존, 미팅룸, Dev 존, QA 존, Design 존)이 보임
- [ ] 6개 캐릭터가 각자의 홈 방 위치에 idle 상태로 서 있음
- [ ] 사이드바 우측에 보임 (팀 현황, 태스크 입력)
- [ ] 우상단 "연결됨" 초록 점 표시

- [ ] **Step 5: 기본 인터랙션 확인**

- [ ] 마우스 휠로 줌 인/아웃 동작
- [ ] 캐릭터 클릭 시 OutputPanel에 해당 에이전트 표시됨
- [ ] 캐릭터 클릭 시 선택 링(글로우)이 발 아래 표시됨

- [ ] **Step 6: gstack 파이프라인 확인 (claude CLI 필요)**

```
태스크 입력창에 "간단한 헬스체크 API 엔드포인트 추가" 입력 후 전송
```

확인:
- [ ] PM 캐릭터가 PM 존으로 걸어가며 말풍선 표시
- [ ] Sidebar 활동 로그에 이벤트 쌓임
- [ ] OutputPanel에 claude 출력 스트리밍됨
- [ ] 파이프라인 완료 후 모든 캐릭터 idle로 복귀

- [ ] **Step 7: 전체 테스트 통과 확인**

```bash
# Backend 테스트
cd /Users/eugene/Desktop/next-multiagents-company/backend
npx vitest run

# Frontend 테스트
cd /Users/eugene/Desktop/next-multiagents-company/frontend
npx vitest run
```

Expected: 모든 테스트 통과

- [ ] **Step 8: 최종 커밋**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add -A
git commit -m "feat: complete isometric office game — R3F 3D office + gstack agents"
```

---

## 트러블슈팅

### R3F에서 `Text` 컴포넌트 폰트 경고
`@react-three/drei`의 `Text`는 기본적으로 Roboto 폰트를 CDN에서 로드한다. 오프라인 환경이거나 경고가 불편하면 `font` prop에 로컬 폰트 경로를 지정하거나 `<Html>` 컴포넌트로 대체한다.

### `capsuleGeometry` not found
Three.js r125 미만에서는 `CapsuleGeometry`가 없다. `npm list three`로 버전 확인 후 r125 이상이면 그대로 사용, 미만이면 `cylinderGeometry`로 대체:
```tsx
<cylinderGeometry args={[0.07, 0.07, 0.35, 8]} />
```

### WebSocket 연결 실패
백엔드가 실행 중인지 확인: `curl http://localhost:3001/health`. 포트 충돌 시 `backend/server.ts`의 `PORT`를 변경하고 `frontend/app/page.tsx`의 `WS_URL`도 함께 변경.

### claude CLI `--dangerously-skip-permissions` 오류
claude CLI 버전이 구버전이면 이 플래그가 없을 수 있다. `claude --version`으로 확인 후 `2.0.0` 미만이면 `--allow-dangerously-skip-permissions` 플래그로 대체하거나 플래그 제거 후 인터랙티브 권한 수락.
