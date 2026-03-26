# Multi-Agent Office Game v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FastAPI simulation with a Node.js server that runs real Claude Code agents sequentially, streaming results to a PixiJS office map in Next.js.

**Architecture:** Node.js server (port 3001) runs each agent via `@anthropic-ai/claude-agent-sdk`, broadcasting WebSocket events as agents move between rooms and generate output. The Next.js frontend replaces framer-motion with PixiJS for WebGL-accelerated rendering of agent sprites and speech bubbles.

**Tech Stack:** Node.js + TypeScript, `@anthropic-ai/claude-agent-sdk`, `ws`, Next.js 16, PixiJS v8, vitest

---

## File Map

**Delete entirely:**
- `backend/` (FastAPI Python server)

**Create (server):**
- `server/package.json`
- `server/tsconfig.json`
- `server/src/types.ts` — WebSocket event shapes
- `server/src/index.ts` — WebSocket server + POST /task HTTP endpoint
- `server/src/orchestrator.ts` — sequential agent pipeline
- `server/src/agents/base.ts` — shared `runAgent()` with claude-agent-sdk
- `server/src/agents/ceo.ts` — CEO prompt + room config
- `server/src/agents/pm.ts` — PM prompt + room config
- `server/src/agents/designer.ts` — Designer prompt + room config
- `server/src/agents/dev.ts` — Dev prompt + room config
- `server/src/agents/qa.ts` — QA prompt + room config
- `server/src/agents/devops.ts` — DevOps prompt + room config
- `server/__tests__/orchestrator.test.ts`
- `server/__tests__/agents.test.ts`

**Modify (frontend):**
- `frontend/package.json` — add pixi.js, remove framer-motion
- `frontend/types/agent.ts` — add new event types
- `frontend/hooks/useAgentStore.ts` — handle new event protocol
- `frontend/app/page.tsx` — swap OfficeMap → OfficeCanvas
- `frontend/components/Sidebar.tsx` — add output file links

**Create (frontend):**
- `frontend/components/OfficeCanvas.tsx` — PixiJS rendering

**Delete (frontend):**
- `frontend/components/OfficeMap.tsx`
- `frontend/components/AgentDot.tsx`
- `frontend/components/SpeechBubble.tsx`

**Modify (root):**
- `package.json` — update dev script (port 8000 → 3001)
- `outputs/` directory created at runtime by server

---

## Task 1: Server project scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/types.ts`

- [ ] **Step 1: Write the failing test (types shape)**

Create `server/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type { AgentMoveEvent, AgentStreamEvent, AgentDoneEvent, TaskCompleteEvent } from '../src/types'

describe('event types', () => {
  it('AgentMoveEvent has required fields', () => {
    const e: AgentMoveEvent = {
      type: 'agent_move',
      agentId: 'ceo',
      room: 'ceo_office',
      x: 580,
      y: 480,
      status: 'active',
    }
    expect(e.type).toBe('agent_move')
  })

  it('AgentStreamEvent has required fields', () => {
    const e: AgentStreamEvent = { type: 'agent_stream', agentId: 'pm', chunk: 'hello' }
    expect(e.chunk).toBe('hello')
  })

  it('AgentDoneEvent has required fields', () => {
    const e: AgentDoneEvent = { type: 'agent_done', agentId: 'dev', outputPath: 'outputs/t1/implementation.md' }
    expect(e.outputPath).toContain('implementation')
  })

  it('TaskCompleteEvent has outputs map', () => {
    const e: TaskCompleteEvent = { type: 'task_complete', outputs: { ceo: 'outputs/t1/ceo_approval.md' } }
    expect(e.outputs.ceo).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test — expect compile error (types not defined)**

```bash
cd server && npx vitest run __tests__/types.test.ts 2>&1 | head -20
```

Expected: error about missing module `../src/types`

- [ ] **Step 3: Create server/package.json**

```json
{
  "name": "multiagent-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "express": "^4.21.2",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20",
    "@types/ws": "^8.5.12",
    "tsx": "^4.19.2",
    "typescript": "^5",
    "vitest": "^4.1.1"
  }
}
```

- [ ] **Step 4: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "__tests__/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create server/src/types.ts**

```typescript
export type RoomKey =
  | 'pm_zone' | 'dev_zone' | 'meeting'
  | 'qa_zone' | 'design' | 'ceo_office'

export type AgentStatus = 'active' | 'idle'

export interface AgentMoveEvent {
  type: 'agent_move'
  agentId: string
  room: RoomKey
  x: number
  y: number
  status: AgentStatus
}

export interface AgentStreamEvent {
  type: 'agent_stream'
  agentId: string
  chunk: string
}

export interface AgentDoneEvent {
  type: 'agent_done'
  agentId: string
  outputPath: string
}

export interface TaskCompleteEvent {
  type: 'task_complete'
  outputs: Record<string, string>
}

export interface ErrorEvent {
  type: 'error'
  message: string
}

export type ServerEvent =
  | AgentMoveEvent
  | AgentStreamEvent
  | AgentDoneEvent
  | TaskCompleteEvent
  | ErrorEvent

export interface TaskStartMessage {
  type: 'task_start'
  description: string
}

export interface AgentDefinition {
  id: string
  room: RoomKey
  x: number
  y: number
  homeRoom: RoomKey
  homeX: number
  homeY: number
  outputFile: string
  buildPrompt: (task: string, previousOutputs: Record<string, string>) => string
}
```

- [ ] **Step 6: Install server dependencies**

```bash
cd server && npm install
```

- [ ] **Step 7: Run test — expect PASS**

```bash
cd server && npx vitest run __tests__/types.test.ts
```

Expected: 4 tests pass

- [ ] **Step 8: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add server/
git commit -m "feat: scaffold server project with TypeScript + event types"
```

---

## Task 2: Base agent runner

**Files:**
- Create: `server/src/agents/base.ts`
- Create: `server/__tests__/agents.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/__tests__/agents.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runAgent } from '../src/agents/base'
import type { AgentRunOptions } from '../src/agents/base'

// Mock @anthropic-ai/claude-agent-sdk
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(async function* () {
    yield { result: '# CEO Approval\n\n태스크를 승인합니다.' }
  }),
}))

// Mock fs
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('runAgent', () => {
  const chunks: string[] = []
  const mockOnChunk = vi.fn((c: string) => chunks.push(c))

  beforeEach(() => {
    chunks.length = 0
    mockOnChunk.mockClear()
  })

  it('returns final result text', async () => {
    const opts: AgentRunOptions = {
      taskId: 'test-001',
      prompt: 'Approve this task',
      outputFile: 'ceo_approval.md',
      onChunk: mockOnChunk,
    }
    const result = await runAgent(opts)
    expect(result).toContain('CEO Approval')
  })

  it('calls onChunk with text content', async () => {
    const opts: AgentRunOptions = {
      taskId: 'test-001',
      prompt: 'Approve this task',
      outputFile: 'ceo_approval.md',
      onChunk: mockOnChunk,
    }
    await runAgent(opts)
    expect(mockOnChunk).toHaveBeenCalled()
    expect(chunks.join('')).toContain('CEO Approval')
  })

  it('saves output to correct path', async () => {
    const fs = await import('fs/promises')
    const opts: AgentRunOptions = {
      taskId: 'task-xyz',
      prompt: 'test',
      outputFile: 'ceo_approval.md',
      onChunk: vi.fn(),
    }
    await runAgent(opts)
    expect(fs.default.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('task-xyz/ceo_approval.md'),
      expect.any(String),
    )
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npx vitest run __tests__/agents.test.ts 2>&1 | head -20
```

Expected: FAIL — `runAgent` not found

- [ ] **Step 3: Create server/src/agents/base.ts**

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk'
import fs from 'fs/promises'
import path from 'path'

export interface AgentRunOptions {
  taskId: string
  prompt: string
  outputFile: string
  onChunk: (chunk: string) => void
}

export async function runAgent(options: AgentRunOptions): Promise<string> {
  const { taskId, prompt, outputFile, onChunk } = options

  let fullText = ''

  for await (const message of query({ prompt, options: { allowedTools: [] } })) {
    if ('result' in message && typeof message.result === 'string') {
      fullText = message.result
      // Stream result in 40-char chunks so speech bubble animates
      const CHUNK_SIZE = 40
      for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        onChunk(fullText.slice(i, i + CHUNK_SIZE))
        await new Promise(r => setTimeout(r, 30))
      }
    }
  }

  const outputDir = path.join('outputs', taskId)
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, outputFile), fullText)

  return fullText
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npx vitest run __tests__/agents.test.ts
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add server/src/agents/base.ts server/__tests__/agents.test.ts
git commit -m "feat: base agent runner with claude-agent-sdk + file save"
```

---

## Task 3: Individual agent definitions

**Files:**
- Create: `server/src/agents/ceo.ts`
- Create: `server/src/agents/pm.ts`
- Create: `server/src/agents/designer.ts`
- Create: `server/src/agents/dev.ts`
- Create: `server/src/agents/qa.ts`
- Create: `server/src/agents/devops.ts`
- Create: `server/src/agents/index.ts`

- [ ] **Step 1: Write the failing test**

Add to `server/__tests__/agents.test.ts`:

```typescript
import { AGENT_DEFINITIONS } from '../src/agents/index'

describe('AGENT_DEFINITIONS', () => {
  it('has 6 agents in correct order', () => {
    const ids = AGENT_DEFINITIONS.map(a => a.id)
    expect(ids).toEqual(['ceo', 'pm', 'designer', 'dev', 'qa', 'devops'])
  })

  it('each agent has valid room coords', () => {
    const ROOMS = {
      ceo_office: { x: 580, y: 480 },
      pm_zone:    { x: 68,  y: 60  },
      design:     { x: 580, y: 390 },
      dev_zone:   { x: 580, y: 60  },
      qa_zone:    { x: 68,  y: 420 },
      meeting:    { x: 330, y: 270 },
    }
    for (const agent of AGENT_DEFINITIONS) {
      expect(agent.x).toBe(ROOMS[agent.room as keyof typeof ROOMS].x)
      expect(agent.y).toBe(ROOMS[agent.room as keyof typeof ROOMS].y)
    }
  })

  it('ceo prompt contains task description', () => {
    const ceo = AGENT_DEFINITIONS.find(a => a.id === 'ceo')!
    const prompt = ceo.buildPrompt('로그인 기능 구현', {})
    expect(prompt).toContain('로그인 기능 구현')
  })

  it('pm prompt includes ceo output', () => {
    const pm = AGENT_DEFINITIONS.find(a => a.id === 'pm')!
    const prompt = pm.buildPrompt('로그인', { ceo: '## CEO 승인\n승인합니다.' })
    expect(prompt).toContain('CEO 승인')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npx vitest run __tests__/agents.test.ts 2>&1 | tail -10
```

Expected: FAIL — `AGENT_DEFINITIONS` not found

- [ ] **Step 3: Create server/src/agents/ceo.ts**

```typescript
import type { AgentDefinition } from '../types.js'

export const ceo: AgentDefinition = {
  id: 'ceo',
  room: 'ceo_office',
  x: 580,
  y: 480,
  homeRoom: 'ceo_office',
  homeX: 580,
  homeY: 480,
  outputFile: 'ceo_approval.md',
  buildPrompt: (task, _prev) => `
당신은 스타트업 CEO입니다. 다음 개발 태스크를 검토하고 승인 문서를 작성하세요.

태스크: ${task}

다음 형식으로 마크다운 문서를 작성하세요:
# CEO 승인서

## 태스크 승인
(승인 여부와 이유)

## 개발 방향 (3가지)
1. ...
2. ...
3. ...

## 우선순위
(무엇을 먼저 해야 하는지)
`.trim(),
}
```

- [ ] **Step 4: Create server/src/agents/pm.ts**

```typescript
import type { AgentDefinition } from '../types.js'

export const pm: AgentDefinition = {
  id: 'pm',
  room: 'pm_zone',
  x: 68,
  y: 60,
  homeRoom: 'pm_zone',
  homeX: 68,
  homeY: 60,
  outputFile: 'requirements.md',
  buildPrompt: (task, prev) => `
당신은 PM(Product Manager)입니다. CEO 승인서를 바탕으로 요구사항 문서를 작성하세요.

태스크: ${task}

CEO 승인서:
${prev.ceo ?? '(없음)'}

다음 형식으로 마크다운 문서를 작성하세요:
# 요구사항 문서

## 기능 목록
(구현해야 할 기능들)

## 비기능 요구사항
(성능, 보안, UX 등)

## 마일스톤
- 1주차: ...
- 2주차: ...
`.trim(),
}
```

- [ ] **Step 5: Create server/src/agents/designer.ts**

```typescript
import type { AgentDefinition } from '../types.js'

export const designer: AgentDefinition = {
  id: 'designer',
  room: 'design',
  x: 580,
  y: 390,
  homeRoom: 'design',
  homeX: 580,
  homeY: 390,
  outputFile: 'ui_spec.md',
  buildPrompt: (task, prev) => `
당신은 UI/UX 디자이너입니다. 요구사항 문서를 바탕으로 UI 설계 문서를 작성하세요.

태스크: ${task}

요구사항 문서:
${prev.pm ?? '(없음)'}

다음 형식으로 마크다운 문서를 작성하세요:
# UI 설계 문서

## 화면 목록
(필요한 화면들)

## 주요 컴포넌트
(재사용 가능한 UI 컴포넌트)

## 인터랙션 플로우
(사용자 동선)

## 색상 & 타이포그래피
(디자인 가이드)
`.trim(),
}
```

- [ ] **Step 6: Create server/src/agents/dev.ts**

```typescript
import type { AgentDefinition } from '../types.js'

export const dev: AgentDefinition = {
  id: 'dev',
  room: 'dev_zone',
  x: 580,
  y: 60,
  homeRoom: 'dev_zone',
  homeX: 580,
  homeY: 60,
  outputFile: 'implementation.md',
  buildPrompt: (task, prev) => `
당신은 시니어 개발자입니다. 요구사항과 UI 설계를 바탕으로 구현 계획을 작성하세요.

태스크: ${task}

요구사항 문서:
${prev.pm ?? '(없음)'}

UI 설계 문서:
${prev.designer ?? '(없음)'}

다음 형식으로 마크다운 문서를 작성하세요:
# 구현 계획

## 기술 스택
(사용할 기술)

## 파일 구조
(생성/수정할 파일들)

## 핵심 구현 로직
(코드 예시 포함)

## API 설계
(엔드포인트 목록)
`.trim(),
}
```

- [ ] **Step 7: Create server/src/agents/qa.ts**

```typescript
import type { AgentDefinition } from '../types.js'

export const qa: AgentDefinition = {
  id: 'qa',
  room: 'qa_zone',
  x: 68,
  y: 420,
  homeRoom: 'qa_zone',
  homeX: 68,
  homeY: 420,
  outputFile: 'test_cases.md',
  buildPrompt: (task, prev) => `
당신은 QA 엔지니어입니다. 구현 계획을 바탕으로 테스트 케이스를 작성하세요.

태스크: ${task}

구현 계획:
${prev.dev ?? '(없음)'}

다음 형식으로 마크다운 문서를 작성하세요:
# 테스트 케이스

## 단위 테스트
(함수/컴포넌트 단위 테스트)

## 통합 테스트
(API, DB 연동 테스트)

## E2E 테스트
(사용자 시나리오 테스트)

## 엣지 케이스
(예외 상황 처리)
`.trim(),
}
```

- [ ] **Step 8: Create server/src/agents/devops.ts**

```typescript
import type { AgentDefinition } from '../types.js'

export const devops: AgentDefinition = {
  id: 'devops',
  room: 'meeting',
  x: 330,
  y: 270,
  homeRoom: 'meeting',
  homeX: 330,
  homeY: 270,
  outputFile: 'deploy_script.md',
  buildPrompt: (task, prev) => `
당신은 DevOps 엔지니어입니다. 구현 계획을 바탕으로 배포 스크립트와 CI/CD 설정을 작성하세요.

태스크: ${task}

구현 계획:
${prev.dev ?? '(없음)'}

다음 형식으로 마크다운 문서를 작성하세요:
# 배포 계획

## 환경 설정
(개발/스테이징/프로덕션)

## Docker 설정
\`\`\`dockerfile
# Dockerfile 예시
\`\`\`

## CI/CD 파이프라인
\`\`\`yaml
# GitHub Actions 워크플로우
\`\`\`

## 배포 체크리스트
(배포 전 확인사항)
`.trim(),
}
```

- [ ] **Step 9: Create server/src/agents/index.ts**

```typescript
import { ceo } from './ceo.js'
import { pm } from './pm.js'
import { designer } from './designer.js'
import { dev } from './dev.js'
import { qa } from './qa.js'
import { devops } from './devops.js'
import type { AgentDefinition } from '../types.js'

export const AGENT_DEFINITIONS: AgentDefinition[] = [ceo, pm, designer, dev, qa, devops]
```

- [ ] **Step 10: Run test — expect PASS**

```bash
cd server && npx vitest run __tests__/agents.test.ts
```

Expected: all tests pass

- [ ] **Step 11: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add server/src/agents/
git commit -m "feat: 6 agent definitions with role-specific prompts"
```

---

## Task 4: Orchestrator

**Files:**
- Create: `server/src/orchestrator.ts`
- Create: `server/__tests__/orchestrator.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/__tests__/orchestrator.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Orchestrator } from '../src/orchestrator'
import type { ServerEvent } from '../src/types'

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(async function* () {
    yield { result: '## Output\n테스트 산출물입니다.' }
  }),
}))

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('## Previous output'),
  },
}))

describe('Orchestrator', () => {
  const events: ServerEvent[] = []
  const broadcast = vi.fn((e: ServerEvent) => events.push(e))

  beforeEach(() => {
    events.length = 0
    broadcast.mockClear()
  })

  it('broadcasts agent_move for each agent', async () => {
    const orch = new Orchestrator(broadcast)
    await orch.runTask('테스트 태스크', 'task-001')

    const movEvents = events.filter(e => e.type === 'agent_move')
    // 6 active moves + 6 idle returns = 12
    expect(movEvents.length).toBe(12)
  })

  it('broadcasts in CEO→PM→Designer→Dev→QA→DevOps order', async () => {
    const orch = new Orchestrator(broadcast)
    await orch.runTask('태스크', 'task-002')

    const activeMove = events
      .filter(e => e.type === 'agent_move' && e.status === 'active')
      .map(e => e.agentId)
    expect(activeMove).toEqual(['ceo', 'pm', 'designer', 'dev', 'qa', 'devops'])
  })

  it('broadcasts task_complete at end', async () => {
    const orch = new Orchestrator(broadcast)
    await orch.runTask('태스크', 'task-003')

    const last = events[events.length - 1]
    expect(last.type).toBe('task_complete')
    expect((last as any).outputs).toHaveProperty('ceo')
  })

  it('rejects concurrent tasks', async () => {
    const orch = new Orchestrator(broadcast)
    const p1 = orch.runTask('태스크1', 'task-004')
    await expect(orch.runTask('태스크2', 'task-005')).rejects.toThrow('already running')
    await p1
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd server && npx vitest run __tests__/orchestrator.test.ts 2>&1 | head -15
```

Expected: FAIL — `Orchestrator` not found

- [ ] **Step 3: Create server/src/orchestrator.ts**

```typescript
import { runAgent } from './agents/base.js'
import { AGENT_DEFINITIONS } from './agents/index.js'
import type { ServerEvent, AgentDefinition } from './types.js'

export class Orchestrator {
  private running = false

  constructor(private broadcast: (event: ServerEvent) => void) {}

  async runTask(description: string, taskId: string): Promise<void> {
    if (this.running) throw new Error('A task is already running')
    this.running = true

    const outputs: Record<string, string> = {}

    try {
      for (const agent of AGENT_DEFINITIONS) {
        // Move agent to work room
        this.broadcast({
          type: 'agent_move',
          agentId: agent.id,
          room: agent.room,
          x: agent.x,
          y: agent.y,
          status: 'active',
        })

        const output = await runAgent({
          taskId,
          prompt: agent.buildPrompt(description, outputs),
          outputFile: agent.outputFile,
          onChunk: (chunk) => {
            this.broadcast({ type: 'agent_stream', agentId: agent.id, chunk })
          },
        })

        outputs[agent.id] = output
        const outputPath = `outputs/${taskId}/${agent.outputFile}`

        this.broadcast({ type: 'agent_done', agentId: agent.id, outputPath })

        // Return agent to home
        this.broadcast({
          type: 'agent_move',
          agentId: agent.id,
          room: agent.homeRoom,
          x: agent.homeX,
          y: agent.homeY,
          status: 'idle',
        })
      }

      this.broadcast({ type: 'task_complete', outputs: Object.fromEntries(
        AGENT_DEFINITIONS.map(a => [a.id, `outputs/${taskId}/${a.outputFile}`])
      )})
    } finally {
      this.running = false
    }
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd server && npx vitest run __tests__/orchestrator.test.ts
```

Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add server/src/orchestrator.ts server/__tests__/orchestrator.test.ts
git commit -m "feat: sequential orchestrator — CEO→PM→Designer→Dev→QA→DevOps"
```

---

## Task 5: WebSocket server + HTTP API

**Files:**
- Create: `server/src/index.ts`

- [ ] **Step 1: Create server/src/index.ts**

```typescript
import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import { Orchestrator } from './orchestrator.js'
import type { ServerEvent, TaskStartMessage } from './types.js'

const app = express()
app.use(express.json())

const server = createServer(app)
const wss = new WebSocketServer({ server })

const clients = new Set<WebSocket>()

function broadcast(event: ServerEvent) {
  const data = JSON.stringify(event)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

const orchestrator = new Orchestrator(broadcast)

wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as TaskStartMessage
      if (msg.type === 'task_start') {
        const taskId = randomUUID()
        orchestrator.runTask(msg.description, taskId).catch((err: Error) => {
          broadcast({ type: 'error', message: err.message })
        })
      }
    } catch {
      // ignore malformed messages
    }
  })
})

// HTTP fallback for task submission
app.post('/task', (req, res) => {
  const { description } = req.body as { description: string }
  if (!description) {
    res.status(400).json({ error: 'description required' })
    return
  }
  const taskId = randomUUID()
  orchestrator.runTask(description, taskId).catch(() => {})
  res.json({ taskId })
})

const PORT = process.env.PORT ?? 3001
server.listen(PORT, () => {
  console.log(`Server running on ws://localhost:${PORT}`)
})
```

- [ ] **Step 2: Test server starts**

```bash
cd server && npx tsx src/index.ts &
sleep 2
curl -s -X POST http://localhost:3001/task \
  -H "Content-Type: application/json" \
  -d '{"description":"test"}' | head -c 100
kill %1
```

Expected: `{"taskId":"..."}` — UUID returned

- [ ] **Step 3: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add server/src/index.ts
git commit -m "feat: WebSocket server with HTTP /task endpoint on port 3001"
```

---

## Task 6: Frontend — install PixiJS, remove framer-motion

**Files:**
- Modify: `frontend/package.json`
- Delete: `frontend/components/AgentDot.tsx`
- Delete: `frontend/components/SpeechBubble.tsx`
- Delete: `frontend/components/OfficeMap.tsx`

- [ ] **Step 1: Update frontend/package.json — swap framer-motion for pixi.js**

In `frontend/package.json`, replace the dependencies section:

```json
"dependencies": {
  "pixi.js": "^8.6.0",
  "next": "16.2.1",
  "react": "19.2.4",
  "react-dom": "19.2.4"
}
```

- [ ] **Step 2: Install**

```bash
cd frontend && npm install
```

- [ ] **Step 3: Remove old components**

```bash
rm frontend/components/AgentDot.tsx
rm frontend/components/SpeechBubble.tsx
rm frontend/components/OfficeMap.tsx
rm frontend/__tests__/AgentDot.test.tsx
rm frontend/__tests__/SpeechBubble.test.tsx
```

- [ ] **Step 4: Verify no remaining framer-motion imports**

```bash
grep -r "framer-motion" frontend/components frontend/app frontend/hooks 2>/dev/null || echo "clean"
```

Expected: `clean`

- [ ] **Step 5: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/package.json frontend/package-lock.json
git rm frontend/components/AgentDot.tsx frontend/components/SpeechBubble.tsx frontend/components/OfficeMap.tsx
git rm frontend/__tests__/AgentDot.test.tsx frontend/__tests__/SpeechBubble.test.tsx
git commit -m "feat: swap framer-motion for pixi.js, remove old render components"
```

---

## Task 7: Frontend — update types and useAgentStore

**Files:**
- Modify: `frontend/types/agent.ts`
- Modify: `frontend/hooks/useAgentStore.ts`
- Modify: `frontend/__tests__/useAgentStore.test.ts`

- [ ] **Step 1: Update the test first**

Replace the entire `frontend/__tests__/useAgentStore.test.ts` with:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentStore } from '@/hooks/useAgentStore'

class MockWebSocket {
  static OPEN = 1
  readyState = MockWebSocket.OPEN
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  send = vi.fn()
  close = vi.fn()
}
vi.stubGlobal('WebSocket', MockWebSocket)

describe('useAgentStore', () => {
  it('starts with empty agents and log', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:3001'))
    expect(result.current.agents).toEqual({})
    expect(result.current.log).toEqual([])
  })

  it('handles agent_move event', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:3001'))
    act(() => {
      result.current.wsRef.current?.onmessage?.({
        data: JSON.stringify({
          type: 'agent_move',
          agentId: 'pm', room: 'pm_zone', x: 68, y: 60, status: 'active',
        }),
      } as MessageEvent)
    })
    expect(result.current.agents['pm']).toMatchObject({ agentId: 'pm', status: 'active' })
  })

  it('appends agent_stream chunk to agent message', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:3001'))
    act(() => {
      result.current.wsRef.current?.onmessage?.({
        data: JSON.stringify({ type: 'agent_stream', agentId: 'ceo', chunk: '안녕하세요' }),
      } as MessageEvent)
    })
    expect(result.current.agents['ceo']?.message).toBe('안녕하세요')
  })

  it('clears message on agent_done', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:3001'))
    act(() => {
      result.current.wsRef.current?.onmessage?.({
        data: JSON.stringify({ type: 'agent_stream', agentId: 'ceo', chunk: '작업중' }),
      } as MessageEvent)
    })
    act(() => {
      result.current.wsRef.current?.onmessage?.({
        data: JSON.stringify({ type: 'agent_done', agentId: 'ceo', outputPath: 'outputs/t1/ceo_approval.md' }),
      } as MessageEvent)
    })
    expect(result.current.agents['ceo']?.message).toBe('')
    expect(result.current.log[0]).toContain('ceo_approval.md')
  })

  it('sendTask sends task_start message', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:3001'))
    act(() => result.current.sendTask('로그인 구현'))
    const ws = result.current.wsRef.current as unknown as MockWebSocket
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'task_start', description: '로그인 구현' })
    )
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd frontend && npx vitest run __tests__/useAgentStore.test.ts 2>&1 | tail -15
```

Expected: FAIL — shape mismatch (current hook expects different event types)

- [ ] **Step 3: Update frontend/types/agent.ts**

```typescript
export type RoomKey =
  | 'pm_zone' | 'dev_zone' | 'meeting'
  | 'qa_zone' | 'design' | 'ceo_office'

export type AgentStatus = 'active' | 'idle'

export interface AgentState {
  agentId: string
  room: RoomKey
  x: number
  y: number
  status: AgentStatus
  message: string
}

export interface Room {
  x: number
  y: number
  label: string
  icon: string
}

export interface AgentConfig {
  id: string
  role: string
  emoji: string
  color: string
  homeRoom: RoomKey
}

// WebSocket events from server
export type ServerEvent =
  | { type: 'agent_move'; agentId: string; room: RoomKey; x: number; y: number; status: AgentStatus }
  | { type: 'agent_stream'; agentId: string; chunk: string }
  | { type: 'agent_done'; agentId: string; outputPath: string }
  | { type: 'task_complete'; outputs: Record<string, string> }
  | { type: 'error'; message: string }
```

- [ ] **Step 4: Update frontend/hooks/useAgentStore.ts**

```typescript
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { AgentState, ServerEvent } from '@/types/agent'

export interface AgentStore {
  agents: Record<string, AgentState>
  log: string[]
  sendTask: (description: string) => void
  wsRef: React.MutableRefObject<WebSocket | null>
}

export function useAgentStore(url: string): AgentStore {
  const [agents, setAgents] = useState<Record<string, AgentState>>({})
  const [log, setLog] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const addLog = (entry: string) =>
    setLog(prev => [entry, ...prev].slice(0, 100))

  useEffect(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as ServerEvent

      if (data.type === 'agent_move') {
        setAgents(prev => ({
          ...prev,
          [data.agentId]: {
            ...prev[data.agentId],
            agentId: data.agentId,
            room: data.room,
            x: data.x,
            y: data.y,
            status: data.status,
            message: prev[data.agentId]?.message ?? '',
          },
        }))
      } else if (data.type === 'agent_stream') {
        setAgents(prev => ({
          ...prev,
          [data.agentId]: {
            ...prev[data.agentId],
            agentId: data.agentId,
            message: (prev[data.agentId]?.message ?? '') + data.chunk,
          },
        }))
      } else if (data.type === 'agent_done') {
        setAgents(prev => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], message: '' },
        }))
        addLog(`✅ ${data.agentId}: ${data.outputPath}`)
      } else if (data.type === 'task_complete') {
        addLog(`🎉 태스크 완료 — ${Object.keys(data.outputs).length}개 산출물 생성`)
      } else if (data.type === 'error') {
        addLog(`❌ 오류: ${data.message}`)
      }
    }

    ws.onerror = () => addLog('⚠️ 서버 연결 실패')

    return () => ws.close()
  }, [url])

  const sendTask = useCallback((description: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'task_start', description }))
    }
  }, [])

  return { agents, log, sendTask, wsRef }
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd frontend && npx vitest run __tests__/useAgentStore.test.ts
```

Expected: 5 tests pass

- [ ] **Step 6: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/types/agent.ts frontend/hooks/useAgentStore.ts frontend/__tests__/useAgentStore.test.ts
git commit -m "feat: update types and useAgentStore for new v2 event protocol"
```

---

## Task 8: Frontend — PixiJS OfficeCanvas

**Files:**
- Create: `frontend/components/OfficeCanvas.tsx`

- [ ] **Step 1: Create frontend/components/OfficeCanvas.tsx**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { ROOMS, AGENTS } from '@/constants/office'
import type { AgentState } from '@/types/agent'

interface Props {
  agents: Record<string, AgentState>
}

interface AgentSprite {
  container: PIXI.Container
  circle: PIXI.Graphics
  emojiText: PIXI.Text
  bubbleBg: PIXI.Graphics
  bubbleText: PIXI.Text
  targetX: number
  targetY: number
}

const CANVAS_W = 800
const CANVAS_H = 600
const ROOM_W = 120
const ROOM_H = 80

export default function OfficeCanvas({ agents }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spritesRef = useRef<Map<string, AgentSprite>>(new Map())

  useEffect(() => {
    if (!containerRef.current) return

    let app: PIXI.Application | null = null

    const init = async () => {
      app = new PIXI.Application()
      await app.init({
        width: CANVAS_W,
        height: CANVAS_H,
        background: '#1a1a2e',
        antialias: true,
      })
      containerRef.current!.appendChild(app.canvas)

      // Draw grid
      const grid = new PIXI.Graphics()
      for (let x = 0; x < CANVAS_W; x += 20) {
        grid.moveTo(x, 0).lineTo(x, CANVAS_H)
      }
      for (let y = 0; y < CANVAS_H; y += 20) {
        grid.moveTo(0, y).lineTo(CANVAS_W, y)
      }
      grid.stroke({ color: 0x2a2a4a, width: 1 })
      app.stage.addChild(grid)

      // Draw rooms
      for (const [key, room] of Object.entries(ROOMS)) {
        const roomContainer = new PIXI.Container()
        roomContainer.x = room.x
        roomContainer.y = room.y

        const bg = new PIXI.Graphics()
        bg.roundRect(0, 0, ROOM_W, ROOM_H, 8)
        bg.fill({ color: 0x2a2a4e, alpha: 0.9 })
        bg.stroke({ color: 0x4a4a8a, width: 1.5 })
        roomContainer.addChild(bg)

        const iconText = new PIXI.Text({
          text: room.icon,
          style: { fontSize: 24 },
        })
        iconText.x = ROOM_W / 2 - iconText.width / 2
        iconText.y = 12
        roomContainer.addChild(iconText)

        const labelText = new PIXI.Text({
          text: room.label,
          style: { fontSize: 10, fill: '#aaaacc' },
        })
        labelText.x = ROOM_W / 2 - labelText.width / 2
        labelText.y = ROOM_H - 20
        roomContainer.addChild(labelText)

        app.stage.addChild(roomContainer)
      }

      // Create agent sprites
      for (const agentCfg of AGENTS) {
        const room = ROOMS[agentCfg.homeRoom]
        const startX = room.x + ROOM_W / 2
        const startY = room.y + ROOM_H / 2

        const container = new PIXI.Container()
        container.x = startX
        container.y = startY

        const circle = new PIXI.Graphics()
        circle.circle(0, 0, 18)
        circle.fill({ color: agentCfg.color })
        container.addChild(circle)

        const emojiText = new PIXI.Text({
          text: agentCfg.emoji,
          style: { fontSize: 18 },
        })
        emojiText.anchor.set(0.5)
        emojiText.x = 0
        emojiText.y = 0
        container.addChild(emojiText)

        // Speech bubble
        const bubbleBg = new PIXI.Graphics()
        bubbleBg.visible = false
        container.addChild(bubbleBg)

        const bubbleText = new PIXI.Text({
          text: '',
          style: {
            fontSize: 10,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: 150,
          },
        })
        bubbleText.x = 8
        bubbleText.y = 6
        bubbleText.visible = false
        container.addChild(bubbleText)

        app.stage.addChild(container)

        spritesRef.current.set(agentCfg.id, {
          container,
          circle,
          emojiText,
          bubbleBg,
          bubbleText,
          targetX: startX,
          targetY: startY,
        })
      }

      // Lerp animation ticker
      app.ticker.add(() => {
        for (const sprite of spritesRef.current.values()) {
          sprite.container.x += (sprite.targetX - sprite.container.x) * 0.08
          sprite.container.y += (sprite.targetY - sprite.container.y) * 0.08
        }
      })
    }

    init()

    return () => {
      app?.destroy(true)
      spritesRef.current.clear()
    }
  }, [])

  // Update sprites when agents prop changes
  useEffect(() => {
    for (const [id, state] of Object.entries(agents)) {
      const sprite = spritesRef.current.get(id)
      if (!sprite) continue

      const room = ROOMS[state.room]
      if (room) {
        sprite.targetX = room.x + ROOM_W / 2
        sprite.targetY = room.y + ROOM_H / 2
      }

      // Update speech bubble
      if (state.message) {
        const maxChars = 80
        const displayText = state.message.slice(-maxChars)
        sprite.bubbleText.text = displayText
        sprite.bubbleText.visible = true

        const bw = Math.min(sprite.bubbleText.width + 16, 180)
        const bh = sprite.bubbleText.height + 12
        sprite.bubbleBg.clear()
        sprite.bubbleBg.roundRect(-bw / 2, -bh - 26, bw, bh, 6)
        sprite.bubbleBg.fill({ color: 0x000000, alpha: 0.75 })
        sprite.bubbleBg.visible = true
        sprite.bubbleText.x = -bw / 2 + 8
        sprite.bubbleText.y = -bh - 26 + 6
      } else {
        sprite.bubbleBg.visible = false
        sprite.bubbleText.visible = false
      }
    }
  }, [agents])

  return (
    <div
      ref={containerRef}
      style={{ width: CANVAS_W, height: CANVAS_H, borderRadius: 12, overflow: 'hidden' }}
    />
  )
}
```

- [ ] **Step 2: Run frontend tests — existing tests should still pass**

```bash
cd frontend && npx vitest run 2>&1 | tail -20
```

Expected: tests in `constants.test.ts`, `useAgentStore.test.ts`, `TaskPanel.test.tsx`, `AgentStatusList.test.tsx`, `ActivityLog.test.tsx` pass (≥10 tests)

- [ ] **Step 3: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/components/OfficeCanvas.tsx
git commit -m "feat: PixiJS OfficeCanvas with rooms, agent sprites, lerp animation"
```

---

## Task 9: Frontend — wire up page.tsx and Sidebar

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/components/Sidebar.tsx`
- Modify: `frontend/components/TaskPanel.tsx`

- [ ] **Step 1: Update frontend/app/page.tsx**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useAgentStore } from '@/hooks/useAgentStore'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'

// PixiJS uses browser APIs — dynamic import disables SSR
const OfficeCanvas = dynamic(() => import('@/components/OfficeCanvas'), { ssr: false })

const WS_URL = 'ws://localhost:3001'

export default function Home() {
  const { agents, log, sendTask } = useAgentStore(WS_URL)

  return (
    <div className="flex flex-col h-screen bg-[#0f0f23] text-white">
      <TopBar />
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        <OfficeCanvas agents={agents} />
        <Sidebar log={log} onSendTask={sendTask} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update frontend/components/Sidebar.tsx**

```tsx
import TaskPanel from './TaskPanel'
import ActivityLog from './ActivityLog'

interface Props {
  log: string[]
  onSendTask: (description: string) => void
}

export default function Sidebar({ log, onSendTask }: Props) {
  return (
    <div className="flex flex-col gap-4 w-80 shrink-0">
      <TaskPanel onSendTask={onSendTask} />
      <ActivityLog log={log} />
    </div>
  )
}
```

- [ ] **Step 3: Update frontend/components/TaskPanel.tsx**

Read the current file first to see its current props interface, then update only the prop name if needed. The component should call `onSendTask(description)` on form submit.

```tsx
'use client'

import { useState } from 'react'

interface Props {
  onSendTask: (description: string) => void
}

export default function TaskPanel({ onSendTask }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSendTask(value.trim())
      setValue('')
    }
  }

  return (
    <div className="bg-[#1a1a3a] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-purple-300 mb-3">태스크 입력</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="개발할 기능을 입력하세요..."
          className="w-full bg-[#0f0f23] border border-purple-900 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          에이전트 실행
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run frontend tests**

```bash
cd frontend && npx vitest run 2>&1 | tail -10
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git add frontend/app/page.tsx frontend/components/Sidebar.tsx frontend/components/TaskPanel.tsx
git commit -m "feat: wire OfficeCanvas + Sidebar into page, PixiJS dynamic import"
```

---

## Task 10: Root package.json + dev script

**Files:**
- Modify: `package.json` (root)
- Delete: `backend/` directory

- [ ] **Step 1: Delete backend directory**

```bash
rm -rf /Users/eugene/Desktop/next-multiagents-company/backend
```

- [ ] **Step 2: Update root package.json**

```json
{
  "name": "next-multiagents-company",
  "version": "2.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix server\"",
    "test:frontend": "npm test --prefix frontend",
    "test:server": "npm test --prefix server"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "concurrently": "^9.2.1"
  }
}
```

- [ ] **Step 3: Create outputs/.gitkeep**

```bash
mkdir -p /Users/eugene/Desktop/next-multiagents-company/outputs
touch /Users/eugene/Desktop/next-multiagents-company/outputs/.gitkeep
```

- [ ] **Step 4: Add outputs/* to .gitignore**

Check if `.gitignore` exists at root. If not, create it. Add:

```
outputs/*
!outputs/.gitkeep
**/.DS_Store
```

- [ ] **Step 5: Verify dev script works**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
npm run dev &
sleep 5
# Check both ports
curl -s http://localhost:3000 | head -c 50 && echo ""
curl -s http://localhost:3001/task -X POST -H "Content-Type: application/json" -d '{}' | head -c 50
kill %1
```

Expected: frontend returns HTML, server returns `{"error":"description required"}`

- [ ] **Step 6: Commit**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git rm -r backend/
git add package.json outputs/.gitkeep .gitignore
git commit -m "feat: remove backend, update dev script for frontend+server concurrently"
```

---

## Self-Review Checklist

### Spec coverage
- ✅ Sequential pipeline CEO→PM→Designer→Dev→QA→DevOps (Task 4)
- ✅ `@anthropic-ai/claude-agent-sdk` with `query()` (Task 2)
- ✅ WebSocket events: agent_move, agent_stream, agent_done, task_complete, error (Task 5)
- ✅ Output files per agent in `outputs/{taskId}/` (Task 2)
- ✅ PixiJS canvas with rooms + sprites + lerp animation (Task 8)
- ✅ Speech bubble with streaming text (Task 8)
- ✅ Sidebar with task input + activity log (Task 9)
- ✅ Port 3001 for server (Task 5, 10)
- ✅ Remove FastAPI backend (Task 10)

### Type consistency
- `AgentState.agentId` used consistently (Task 7 types → Task 7 hook → Task 8 canvas)
- `ServerEvent` union matches server `src/types.ts` and frontend `types/agent.ts`
- `AgentDefinition.buildPrompt(task, previousOutputs)` signature used in all 6 agents and orchestrator
- `ROOM_W = 120`, `ROOM_H = 80` defined once in OfficeCanvas, used for centering in both room draw and agent positioning
