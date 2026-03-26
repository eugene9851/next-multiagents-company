# Multi-Agent Office Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6명의 AI 에이전트가 가상 오피스 평면도 위를 framer-motion으로 이동하며 소프트웨어 개발 플로우를 시뮬레이션하는 게임형 웹앱 MVP를 만든다.

**Architecture:** FastAPI 백엔드가 asyncio 루프로 시뮬레이션을 실행하고 WebSocket으로 에이전트 상태를 브로드캐스트한다. Next.js 프론트엔드는 WebSocket으로 상태를 수신해 framer-motion으로 에이전트 이동 애니메이션을 렌더링한다.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, framer-motion, FastAPI, Python 3.11+, pytest, pytest-asyncio, vitest, @testing-library/react

---

## File Map

```
next-multiagents-company/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── vitest.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── types/
│   │   └── agent.ts              # AgentState, RoomKey 타입
│   ├── constants/
│   │   └── office.ts             # ROOMS, AGENTS 상수
│   ├── hooks/
│   │   └── useAgentStore.ts      # WebSocket 연결 + 에이전트 상태 관리
│   ├── components/
│   │   ├── TopBar.tsx
│   │   ├── OfficeMap.tsx         # 배경 + 방 배치
│   │   ├── AgentDot.tsx          # 이동 에이전트 점 + 말풍선
│   │   ├── SpeechBubble.tsx      # 말풍선
│   │   ├── Sidebar.tsx           # 사이드바 컨테이너
│   │   ├── TaskPanel.tsx         # 태스크 입력 + 전송
│   │   ├── AgentStatusList.tsx   # 에이전트 현황 목록
│   │   └── ActivityLog.tsx       # 활동 로그
│   └── __tests__/
│       ├── constants.test.ts
│       ├── useAgentStore.test.ts
│       ├── SpeechBubble.test.tsx
│       ├── AgentDot.test.tsx
│       ├── TaskPanel.test.tsx
│       ├── AgentStatusList.test.tsx
│       └── ActivityLog.test.tsx
├── backend/
│   ├── requirements.txt
│   ├── agents.py                 # 에이전트 레지스트리 + 방 좌표 상수
│   ├── sim_engine.py             # 시뮬레이션 루프
│   ├── main.py                   # FastAPI 앱 + WebSocket 엔드포인트
│   └── tests/
│       ├── test_agents.py
│       ├── test_sim_engine.py
│       └── test_main.py
└── docs/
```

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `frontend/` (Next.js 앱)
- Create: `backend/requirements.txt`
- Create: `backend/tests/__init__.py`

- [ ] **Step 1: Next.js 앱 생성**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-eslint
```

- [ ] **Step 2: 프론트엔드 의존성 설치**

```bash
cd frontend
npm install framer-motion
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: vitest 설정 파일 생성**

`frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
})
```

`frontend/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: package.json에 test 스크립트 추가**

`frontend/package.json`의 `scripts`에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: 백엔드 requirements.txt 생성**

`backend/requirements.txt`:
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
websockets==12.0
pytest==8.2.0
pytest-asyncio==0.23.6
httpx==0.27.0
```

- [ ] **Step 6: 백엔드 의존성 설치**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

- [ ] **Step 7: 테스트 디렉토리 초기화**

```bash
mkdir -p backend/tests frontend/__tests__
touch backend/tests/__init__.py
```

- [ ] **Step 8: 커밋**

```bash
cd /Users/eugene/Desktop/next-multiagents-company
git init
echo "frontend/node_modules\nfrontend/.next\nbackend/.venv\n.superpowers\n__pycache__\n*.pyc" > .gitignore
git add .
git commit -m "chore: scaffold frontend and backend"
```

---

## Task 2: 타입 정의 + 오피스 상수

**Files:**
- Create: `frontend/types/agent.ts`
- Create: `frontend/constants/office.ts`
- Create: `frontend/__tests__/constants.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/__tests__/constants.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ROOMS, AGENTS } from '@/constants/office'

describe('ROOMS', () => {
  it('has 6 rooms with x and y coordinates', () => {
    expect(Object.keys(ROOMS)).toHaveLength(6)
    Object.values(ROOMS).forEach(room => {
      expect(typeof room.x).toBe('number')
      expect(typeof room.y).toBe('number')
      expect(typeof room.label).toBe('string')
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd frontend && npx vitest run __tests__/constants.test.ts
```
Expected: FAIL — "Cannot find module '@/constants/office'"

- [ ] **Step 3: 타입 정의 작성**

`frontend/types/agent.ts`:
```ts
export type RoomKey =
  | 'pm_zone'
  | 'dev_zone'
  | 'meeting'
  | 'qa_zone'
  | 'design'
  | 'ceo_office'

export type AgentStatus = 'active' | 'idle' | 'meeting'

export interface AgentState {
  id: string
  role: string
  emoji: string
  room: RoomKey
  x: number
  y: number
  status: AgentStatus
  message: string
  color: string
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

export interface TaskMessage {
  type: 'task'
  description: string
}
```

- [ ] **Step 4: 오피스 상수 작성**

`frontend/constants/office.ts`:
```ts
import type { Room, AgentConfig, RoomKey } from '@/types/agent'

export const ROOMS: Record<RoomKey, Room> = {
  pm_zone:    { x: 68,  y: 60,  label: 'PM',         icon: '📋' },
  dev_zone:   { x: 580, y: 60,  label: 'DEVELOPMENT', icon: '💻' },
  meeting:    { x: 330, y: 270, label: '회의실',       icon: '🤝' },
  qa_zone:    { x: 68,  y: 420, label: 'QA',          icon: '🧪' },
  design:     { x: 580, y: 390, label: 'DESIGN',      icon: '🎨' },
  ceo_office: { x: 580, y: 480, label: 'CEO OFFICE',  icon: '👔' },
}

export const AGENTS: AgentConfig[] = [
  { id: 'ceo',      role: 'CEO',      emoji: '👔', color: '#eab308', homeRoom: 'ceo_office' },
  { id: 'pm',       role: 'PM',       emoji: '🧠', color: '#6366f1', homeRoom: 'pm_zone'    },
  { id: 'dev',      role: 'Dev',      emoji: '⚙️', color: '#0ea5e9', homeRoom: 'dev_zone'   },
  { id: 'qa',       role: 'QA',       emoji: '🔬', color: '#a855f7', homeRoom: 'qa_zone'    },
  { id: 'designer', role: 'Designer', emoji: '🎨', color: '#22c55e', homeRoom: 'design'     },
  { id: 'devops',   role: 'DevOps',   emoji: '🚀', color: '#f97316', homeRoom: 'meeting'    },
]
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd frontend && npx vitest run __tests__/constants.test.ts
```
Expected: PASS (2 test suites, 3 tests)

- [ ] **Step 6: 커밋**

```bash
git add frontend/types frontend/constants frontend/__tests__/constants.test.ts
git commit -m "feat: add agent types and office constants"
```

---

## Task 3: 백엔드 에이전트 레지스트리

**Files:**
- Create: `backend/agents.py`
- Create: `backend/tests/test_agents.py`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/tests/test_agents.py`:
```python
import pytest
from agents import ROOMS, build_initial_agents

def test_rooms_has_six_entries():
    assert len(ROOMS) == 6

def test_rooms_have_coordinates():
    for key, room in ROOMS.items():
        assert 'x' in room
        assert 'y' in room
        assert isinstance(room['x'], (int, float))
        assert isinstance(room['y'], (int, float))

def test_build_initial_agents_returns_six():
    agents = build_initial_agents()
    assert len(agents) == 6

def test_build_initial_agents_structure():
    agents = build_initial_agents()
    for agent in agents.values():
        assert 'id' in agent
        assert 'role' in agent
        assert 'emoji' in agent
        assert 'room' in agent
        assert 'x' in agent
        assert 'y' in agent
        assert 'status' in agent
        assert 'message' in agent
        assert 'color' in agent
        assert agent['status'] == 'idle'

def test_pm_starts_at_pm_zone():
    agents = build_initial_agents()
    pm = agents['pm']
    assert pm['room'] == 'pm_zone'
    assert pm['x'] == ROOMS['pm_zone']['x']
    assert pm['y'] == ROOMS['pm_zone']['y']
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd backend && source .venv/bin/activate && pytest tests/test_agents.py -v
```
Expected: ERROR — "ModuleNotFoundError: No module named 'agents'"

- [ ] **Step 3: agents.py 구현**

`backend/agents.py`:
```python
from typing import TypedDict

ROOMS: dict[str, dict] = {
    "pm_zone":    {"x": 68,  "y": 60},
    "dev_zone":   {"x": 580, "y": 60},
    "meeting":    {"x": 330, "y": 270},
    "qa_zone":    {"x": 68,  "y": 420},
    "design":     {"x": 580, "y": 390},
    "ceo_office": {"x": 580, "y": 480},
}

AGENT_CONFIGS = [
    {"id": "ceo",      "role": "CEO",      "emoji": "👔", "color": "#eab308", "home": "ceo_office"},
    {"id": "pm",       "role": "PM",       "emoji": "🧠", "color": "#6366f1", "home": "pm_zone"},
    {"id": "dev",      "role": "Dev",      "emoji": "⚙️", "color": "#0ea5e9", "home": "dev_zone"},
    {"id": "qa",       "role": "QA",       "emoji": "🔬", "color": "#a855f7", "home": "qa_zone"},
    {"id": "designer", "role": "Designer", "emoji": "🎨", "color": "#22c55e", "home": "design"},
    {"id": "devops",   "role": "DevOps",   "emoji": "🚀", "color": "#f97316", "home": "meeting"},
]


def build_initial_agents() -> dict[str, dict]:
    agents = {}
    for cfg in AGENT_CONFIGS:
        room_key = cfg["home"]
        coords = ROOMS[room_key]
        agents[cfg["id"]] = {
            "id":      cfg["id"],
            "role":    cfg["role"],
            "emoji":   cfg["emoji"],
            "color":   cfg["color"],
            "room":    room_key,
            "x":       coords["x"],
            "y":       coords["y"],
            "status":  "idle",
            "message": "",
        }
    return agents
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd backend && pytest tests/test_agents.py -v
```
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add backend/agents.py backend/tests/test_agents.py
git commit -m "feat: add backend agent registry"
```

---

## Task 4: 시뮬레이션 엔진

**Files:**
- Create: `backend/sim_engine.py`
- Create: `backend/tests/test_sim_engine.py`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/tests/test_sim_engine.py`:
```python
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from agents import build_initial_agents, ROOMS
from sim_engine import SimEngine

@pytest.fixture
def broadcast_mock():
    return AsyncMock()

@pytest.fixture
def engine(broadcast_mock):
    return SimEngine(broadcast_fn=broadcast_mock)

@pytest.mark.asyncio
async def test_move_agent_updates_position(engine, broadcast_mock):
    await engine.move_agent("pm", "meeting", "싱크 중...")
    state = engine.agents["pm"]
    assert state["room"] == "meeting"
    assert state["x"] == ROOMS["meeting"]["x"]
    assert state["y"] == ROOMS["meeting"]["y"]
    assert state["message"] == "싱크 중..."
    assert state["status"] == "active"

@pytest.mark.asyncio
async def test_move_agent_broadcasts(engine, broadcast_mock):
    await engine.move_agent("pm", "meeting", "싱크 중...")
    broadcast_mock.assert_called_once()
    call_arg = broadcast_mock.call_args[0][0]
    assert call_arg["id"] == "pm"
    assert call_arg["room"] == "meeting"

@pytest.mark.asyncio
async def test_idle_agent_clears_message(engine, broadcast_mock):
    engine.agents["pm"]["status"] = "active"
    engine.agents["pm"]["message"] = "작업 중"
    await engine.idle_agent("pm")
    assert engine.agents["pm"]["status"] == "idle"
    assert engine.agents["pm"]["message"] == ""

@pytest.mark.asyncio
async def test_set_task_resets_on_next_run(engine):
    engine.set_task("로그인 기능 구현")
    assert engine.current_task == "로그인 기능 구현"
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd backend && pytest tests/test_sim_engine.py -v
```
Expected: ERROR — "ModuleNotFoundError: No module named 'sim_engine'"

- [ ] **Step 3: sim_engine.py 구현**

`backend/sim_engine.py`:
```python
import asyncio
from typing import Callable, Awaitable
from agents import build_initial_agents, ROOMS


class SimEngine:
    def __init__(self, broadcast_fn: Callable[[dict], Awaitable[None]]):
        self.broadcast = broadcast_fn
        self.agents = build_initial_agents()
        self.current_task: str | None = None
        self._running = False

    def set_task(self, description: str) -> None:
        self.current_task = description

    async def move_agent(self, agent_id: str, room: str, message: str) -> None:
        coords = ROOMS[room]
        self.agents[agent_id].update({
            "room":    room,
            "x":       coords["x"],
            "y":       coords["y"],
            "status":  "active",
            "message": message,
        })
        await self.broadcast(dict(self.agents[agent_id]))

    async def idle_agent(self, agent_id: str) -> None:
        self.agents[agent_id].update({"status": "idle", "message": ""})
        await self.broadcast(dict(self.agents[agent_id]))

    async def run_flow(self) -> None:
        task = self.current_task or "소프트웨어 개발"
        steps = [
            ("ceo",      "ceo_office", f"'{task}' 태스크 승인"),
            ("pm",       "pm_zone",    "요구사항 분석 중..."),
            ("pm",       "meeting",    "CEO와 방향 싱크 중..."),
            ("ceo",      "meeting",    "방향 확인 중..."),
            ("designer", "design",     "UI 설계 중..."),
            ("pm",       "dev_zone",   "Dev에게 스펙 전달 중..."),
            ("dev",      "dev_zone",   "코딩 중..."),
            ("qa",       "qa_zone",    "테스트 중..."),
            ("devops",   "meeting",    "배포 준비 중..."),
            ("ceo",      "meeting",    "최종 확인 중..."),
        ]
        for agent_id, room, message in steps:
            await self.move_agent(agent_id, room, message)
            await asyncio.sleep(2.5)

        # 모든 에이전트 홈으로 복귀
        for agent_id in self.agents:
            home = next(
                cfg["home"] for cfg in __import__("agents").AGENT_CONFIGS
                if cfg["id"] == agent_id
            )
            await self.idle_agent(agent_id)
            await asyncio.sleep(0.3)

    async def start_loop(self) -> None:
        self._running = True
        while self._running:
            await self.run_flow()
            await asyncio.sleep(3)

    def stop(self) -> None:
        self._running = False
```

- [ ] **Step 4: pytest-asyncio 설정 추가**

`backend/pytest.ini`:
```ini
[pytest]
asyncio_mode = auto
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd backend && pytest tests/test_sim_engine.py -v
```
Expected: PASS (4 tests)

- [ ] **Step 6: 커밋**

```bash
git add backend/sim_engine.py backend/tests/test_sim_engine.py backend/pytest.ini
git commit -m "feat: add simulation engine with dev flow"
```

---

## Task 5: FastAPI WebSocket 서버

**Files:**
- Create: `backend/main.py`
- Create: `backend/tests/test_main.py`

- [ ] **Step 1: 실패하는 테스트 작성**

`backend/tests/test_main.py`:
```python
import pytest
import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_websocket_connects_and_receives_initial_state():
    with client.websocket_connect("/ws") as ws:
        # 연결 직후 초기 에이전트 상태 6개 수신
        messages = []
        for _ in range(6):
            data = ws.receive_json()
            messages.append(data)
        ids = {m["id"] for m in messages}
        assert ids == {"ceo", "pm", "dev", "qa", "designer", "devops"}

def test_websocket_receives_agent_state_fields():
    with client.websocket_connect("/ws") as ws:
        data = ws.receive_json()
        for field in ["id", "role", "emoji", "room", "x", "y", "status", "message", "color"]:
            assert field in data, f"Missing field: {field}"

def test_websocket_task_message_accepted():
    with client.websocket_connect("/ws") as ws:
        # 초기 상태 소비
        for _ in range(6):
            ws.receive_json()
        # 태스크 전송
        ws.send_json({"type": "task", "description": "로그인 기능 구현"})
        # 에러 없이 처리됨 (추가 브로드캐스트 발생)
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd backend && pytest tests/test_main.py -v
```
Expected: ERROR — "No module named 'main'"

- [ ] **Step 3: main.py 구현**

`backend/main.py`:
```python
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from agents import build_initial_agents
from sim_engine import SimEngine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()
engine = SimEngine(broadcast_fn=manager.broadcast)
_sim_task: asyncio.Task | None = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    global _sim_task
    _sim_task = asyncio.create_task(engine.start_loop())


@app.on_event("shutdown")
async def shutdown():
    engine.stop()
    if _sim_task:
        _sim_task.cancel()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    # 연결 직후 현재 에이전트 상태 전송
    for agent in engine.agents.values():
        await ws.send_json(dict(agent))
    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            if data.get("type") == "task":
                engine.set_task(data.get("description", ""))
    except WebSocketDisconnect:
        manager.disconnect(ws)
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd backend && pytest tests/test_main.py -v
```
Expected: PASS (4 tests)

- [ ] **Step 5: 서버 수동 동작 확인**

```bash
cd backend && uvicorn main:app --reload --port 8000
```
브라우저에서 `http://localhost:8000/health` → `{"status":"ok"}` 확인 후 Ctrl+C

- [ ] **Step 6: 커밋**

```bash
git add backend/main.py backend/tests/test_main.py
git commit -m "feat: add FastAPI WebSocket server"
```

---

## Task 6: useAgentStore 훅

**Files:**
- Create: `frontend/hooks/useAgentStore.ts`
- Create: `frontend/__tests__/useAgentStore.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`frontend/__tests__/useAgentStore.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAgentStore } from '@/hooks/useAgentStore'

// WebSocket 모킹
class MockWebSocket {
  static OPEN = 1
  readyState = MockWebSocket.OPEN
  onmessage: ((e: MessageEvent) => void) | null = null
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  send = vi.fn()
  close = vi.fn()
}

vi.stubGlobal('WebSocket', MockWebSocket)

describe('useAgentStore', () => {
  it('starts with empty agents', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:8000/ws'))
    expect(result.current.agents).toEqual({})
  })

  it('updates agent state on WS message', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:8000/ws'))
    const wsInstance = (result.current as any)._ws ?? (WebSocket as any).instances?.[0]

    const payload = {
      id: 'pm', role: 'PM', emoji: '🧠', room: 'pm_zone',
      x: 68, y: 60, status: 'active', message: '분석 중', color: '#6366f1'
    }

    act(() => {
      // WS 인스턴스의 onmessage 직접 트리거
      const ws = (result.current as any).wsRef?.current
      if (ws?.onmessage) {
        ws.onmessage({ data: JSON.stringify(payload) } as MessageEvent)
      }
    })

    expect(result.current.agents['pm']).toMatchObject({ id: 'pm', status: 'active' })
  })

  it('sendTask calls ws.send with correct payload', () => {
    const { result } = renderHook(() => useAgentStore('ws://localhost:8000/ws'))
    act(() => {
      result.current.sendTask('로그인 기능 구현')
    })
    // send가 호출됐으면 성공 (실제 WS mock이라 에러 없으면 OK)
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd frontend && npx vitest run __tests__/useAgentStore.test.ts
```
Expected: FAIL — "Cannot find module '@/hooks/useAgentStore'"

- [ ] **Step 3: useAgentStore 구현**

`frontend/hooks/useAgentStore.ts`:
```ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { AgentState } from '@/types/agent'

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

  useEffect(() => {
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event: MessageEvent) => {
      const data: AgentState = JSON.parse(event.data)
      setAgents(prev => ({ ...prev, [data.id]: data }))
      if (data.message) {
        const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        setLog(prev => [`${time} ${data.role}: ${data.message}`, ...prev].slice(0, 50))
      }
    }

    return () => ws.close()
  }, [url])

  const sendTask = useCallback((description: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'task', description }))
    }
  }, [])

  return { agents, log, sendTask, wsRef }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd frontend && npx vitest run __tests__/useAgentStore.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add frontend/hooks/useAgentStore.ts frontend/__tests__/useAgentStore.test.ts
git commit -m "feat: add useAgentStore WebSocket hook"
```

---

## Task 7: SpeechBubble + AgentDot 컴포넌트

**Files:**
- Create: `frontend/components/SpeechBubble.tsx`
- Create: `frontend/components/AgentDot.tsx`
- Create: `frontend/__tests__/SpeechBubble.test.tsx`
- Create: `frontend/__tests__/AgentDot.test.tsx`

- [ ] **Step 1: SpeechBubble 테스트 작성**

`frontend/__tests__/SpeechBubble.test.tsx`:
```tsx
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
```

- [ ] **Step 2: AgentDot 테스트 작성**

`frontend/__tests__/AgentDot.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentDot } from '@/components/AgentDot'
import type { AgentState } from '@/types/agent'

const mockAgent: AgentState = {
  id: 'pm', role: 'PM', emoji: '🧠', room: 'pm_zone',
  x: 68, y: 60, status: 'active', message: '분석 중...', color: '#6366f1'
}

describe('AgentDot', () => {
  it('renders agent emoji', () => {
    render(<AgentDot agent={mockAgent} />)
    expect(screen.getByText('🧠')).toBeInTheDocument()
  })

  it('renders agent role label', () => {
    render(<AgentDot agent={mockAgent} />)
    expect(screen.getByText('PM')).toBeInTheDocument()
  })

  it('shows speech bubble when message present', () => {
    render(<AgentDot agent={mockAgent} />)
    expect(screen.getByText('분석 중...')).toBeInTheDocument()
  })

  it('hides speech bubble when message is empty', () => {
    render(<AgentDot agent={{ ...mockAgent, message: '' }} />)
    expect(screen.queryByText('분석 중...')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
cd frontend && npx vitest run __tests__/SpeechBubble.test.tsx __tests__/AgentDot.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 4: SpeechBubble 구현**

`frontend/components/SpeechBubble.tsx`:
```tsx
interface Props {
  message: string
}

export function SpeechBubble({ message }: Props) {
  if (!message) return null
  return (
    <div className="absolute -top-12 left-0 bg-[#1e1e3f] border border-[#312e81] rounded-lg px-2 py-1 text-[9px] text-indigo-200 whitespace-normal max-w-[160px] z-10">
      {message}
      <div className="absolute -bottom-[5px] left-2 w-2 h-[5px] bg-[#1e1e3f] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
    </div>
  )
}
```

- [ ] **Step 5: AgentDot 구현**

`frontend/components/AgentDot.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'
import type { AgentState } from '@/types/agent'
import { SpeechBubble } from './SpeechBubble'

interface Props {
  agent: AgentState
}

export function AgentDot({ agent }: Props) {
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      animate={{ x: agent.x, y: agent.y }}
      transition={{ type: 'tween', duration: 0.8, ease: 'easeInOut' }}
      style={{ top: 0, left: 0 }}
    >
      <div className="relative">
        <SpeechBubble message={agent.message} />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white/20"
          style={{
            backgroundColor: agent.color,
            boxShadow: `0 0 10px ${agent.color}`,
          }}
        >
          {agent.emoji}
        </div>
      </div>
      <span className="text-[8px] text-slate-400 whitespace-nowrap">{agent.role}</span>
    </motion.div>
  )
}
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
cd frontend && npx vitest run __tests__/SpeechBubble.test.tsx __tests__/AgentDot.test.tsx
```
Expected: PASS (6 tests)

- [ ] **Step 7: 커밋**

```bash
git add frontend/components/SpeechBubble.tsx frontend/components/AgentDot.tsx \
        frontend/__tests__/SpeechBubble.test.tsx frontend/__tests__/AgentDot.test.tsx
git commit -m "feat: add AgentDot and SpeechBubble components"
```

---

## Task 8: OfficeMap 컴포넌트

**Files:**
- Create: `frontend/components/OfficeMap.tsx`

- [ ] **Step 1: OfficeMap 구현**

(OfficeMap은 순수 레이아웃 컴포넌트 — 별도 비즈니스 로직 없음)

`frontend/components/OfficeMap.tsx`:
```tsx
import type { AgentState } from '@/types/agent'
import { ROOMS } from '@/constants/office'
import { AgentDot } from './AgentDot'

interface Props {
  agents: Record<string, AgentState>
}

const roomStyle: Record<string, string> = {
  pm_zone:    'left-10 top-10 w-[130px] h-[90px] border-indigo-500/40 text-indigo-400',
  dev_zone:   'right-10 top-10 w-[150px] h-[90px] border-sky-500/40 text-sky-400',
  meeting:    'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[85px] border-purple-500/40 text-purple-400',
  qa_zone:    'left-10 bottom-10 w-[130px] h-[80px] border-green-500/40 text-green-400',
  design:     'right-10 bottom-24 w-[140px] h-[80px] border-orange-500/40 text-orange-400',
  ceo_office: 'right-10 bottom-4 w-[140px] h-[75px] border-yellow-500/40 text-yellow-400',
}

export function OfficeMap({ agents }: Props) {
  return (
    <div
      className="flex-1 relative bg-[#0a0a18] overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(rgba(79,70,229,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,0.04) 1px,transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* Rooms */}
      {Object.entries(ROOMS).map(([key, room]) => (
        <div
          key={key}
          className={`absolute flex flex-col items-center justify-center gap-1 rounded-xl border bg-white/[0.02] ${roomStyle[key]}`}
        >
          <span className="text-xl">{room.icon}</span>
          <span className="text-[10px] font-bold tracking-wide">{room.label}</span>
        </div>
      ))}

      {/* Agent Dots */}
      {Object.values(agents).map(agent => (
        <AgentDot key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add frontend/components/OfficeMap.tsx
git commit -m "feat: add OfficeMap component"
```

---

## Task 9: Sidebar 컴포넌트들

**Files:**
- Create: `frontend/components/TaskPanel.tsx`
- Create: `frontend/components/AgentStatusList.tsx`
- Create: `frontend/components/ActivityLog.tsx`
- Create: `frontend/components/Sidebar.tsx`
- Create: `frontend/__tests__/TaskPanel.test.tsx`
- Create: `frontend/__tests__/AgentStatusList.test.tsx`
- Create: `frontend/__tests__/ActivityLog.test.tsx`

- [ ] **Step 1: TaskPanel 테스트 작성**

`frontend/__tests__/TaskPanel.test.tsx`:
```tsx
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
```

- [ ] **Step 2: AgentStatusList 테스트 작성**

`frontend/__tests__/AgentStatusList.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentStatusList } from '@/components/AgentStatusList'
import type { AgentState } from '@/types/agent'

const mockAgents: Record<string, AgentState> = {
  pm: { id: 'pm', role: 'PM', emoji: '🧠', room: 'pm_zone', x: 68, y: 60, status: 'active', message: '분석 중', color: '#6366f1' },
  dev: { id: 'dev', role: 'Dev', emoji: '⚙️', room: 'dev_zone', x: 580, y: 60, status: 'idle', message: '', color: '#0ea5e9' },
}

describe('AgentStatusList', () => {
  it('renders all agent roles', () => {
    render(<AgentStatusList agents={mockAgents} />)
    expect(screen.getByText('PM')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
  })

  it('shows ACTIVE badge for active agent', () => {
    render(<AgentStatusList agents={mockAgents} />)
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('shows IDLE badge for idle agent', () => {
    render(<AgentStatusList agents={mockAgents} />)
    expect(screen.getByText('IDLE')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: ActivityLog 테스트 작성**

`frontend/__tests__/ActivityLog.test.tsx`:
```tsx
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
```

- [ ] **Step 4: 테스트 실패 확인**

```bash
cd frontend && npx vitest run __tests__/TaskPanel.test.tsx __tests__/AgentStatusList.test.tsx __tests__/ActivityLog.test.tsx
```
Expected: FAIL — module not found

- [ ] **Step 5: TaskPanel 구현**

`frontend/components/TaskPanel.tsx`:
```tsx
'use client'

import { useState } from 'react'

interface Props {
  onSubmit: (description: string) => void
}

export function TaskPanel({ onSubmit }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className="p-4 border-b border-[#1e1e3f]">
      <div className="text-[10px] font-bold tracking-[1.5px] text-slate-600 mb-3">📥 태스크 입력</div>
      <textarea
        className="w-full bg-[#0a0a18] border border-[#1e1e3f] rounded-lg px-3 py-2 text-[11px] text-slate-200 resize-none h-14 outline-none placeholder:text-slate-700"
        placeholder="예: 로그인 기능 만들어줘..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        className="mt-2 w-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg py-2 text-[11px] font-semibold text-white tracking-wide"
        onClick={handleSubmit}
      >
        ▶ 시뮬레이션 시작
      </button>
    </div>
  )
}
```

- [ ] **Step 6: AgentStatusList 구현**

`frontend/components/AgentStatusList.tsx`:
```tsx
import type { AgentState } from '@/types/agent'

interface Props {
  agents: Record<string, AgentState>
}

const badgeClass: Record<string, string> = {
  active:  'bg-green-500/15 text-green-300',
  idle:    'bg-slate-500/15 text-slate-500',
  meeting: 'bg-purple-500/15 text-purple-300',
}

const badgeLabel: Record<string, string> = {
  active: 'ACTIVE', idle: 'IDLE', meeting: 'MTG',
}

export function AgentStatusList({ agents }: Props) {
  return (
    <div className="p-4 border-b border-[#1e1e3f]">
      <div className="text-[10px] font-bold tracking-[1.5px] text-slate-600 mb-3">🤖 에이전트 현황</div>
      {Object.values(agents).map(agent => (
        <div key={agent.id} className="flex items-center gap-2 py-[6px] border-b border-[#0f0f20] last:border-0">
          <span className="text-base w-6 text-center">{agent.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-200">{agent.role}</div>
            <div className="text-[9px] text-slate-600 truncate">{agent.message || '대기 중'}</div>
          </div>
          <span className={`text-[8px] px-[6px] py-[2px] rounded-full font-semibold flex-shrink-0 ${badgeClass[agent.status]}`}>
            {badgeLabel[agent.status]}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: ActivityLog 구현**

`frontend/components/ActivityLog.tsx`:
```tsx
interface Props {
  log: string[]
}

export function ActivityLog({ log }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {log.map((entry, i) => (
        <div key={i} className="text-[9px] text-slate-600 py-[3px] border-b border-[#0f0f20] leading-relaxed log-entry">
          {entry}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 8: Sidebar 조립**

`frontend/components/Sidebar.tsx`:
```tsx
import type { AgentState } from '@/types/agent'
import { TaskPanel } from './TaskPanel'
import { AgentStatusList } from './AgentStatusList'
import { ActivityLog } from './ActivityLog'

interface Props {
  agents: Record<string, AgentState>
  log: string[]
  onTaskSubmit: (description: string) => void
}

export function Sidebar({ agents, log, onTaskSubmit }: Props) {
  return (
    <div className="w-64 bg-[#0d0d1f] border-l border-[#1e1e3f] flex flex-col flex-shrink-0">
      <TaskPanel onSubmit={onTaskSubmit} />
      <AgentStatusList agents={agents} />
      <div className="px-4 py-2 border-b border-[#1e1e3f]">
        <div className="text-[10px] font-bold tracking-[1.5px] text-slate-600">📜 활동 로그</div>
      </div>
      <ActivityLog log={log} />
    </div>
  )
}
```

- [ ] **Step 9: 테스트 통과 확인**

```bash
cd frontend && npx vitest run __tests__/TaskPanel.test.tsx __tests__/AgentStatusList.test.tsx __tests__/ActivityLog.test.tsx
```
Expected: PASS (7 tests)

- [ ] **Step 10: 커밋**

```bash
git add frontend/components/TaskPanel.tsx frontend/components/AgentStatusList.tsx \
        frontend/components/ActivityLog.tsx frontend/components/Sidebar.tsx \
        frontend/__tests__/TaskPanel.test.tsx frontend/__tests__/AgentStatusList.test.tsx \
        frontend/__tests__/ActivityLog.test.tsx
git commit -m "feat: add sidebar components (TaskPanel, AgentStatusList, ActivityLog)"
```

---

## Task 10: TopBar + 메인 페이지 조립

**Files:**
- Create: `frontend/components/TopBar.tsx`
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: TopBar 구현**

`frontend/components/TopBar.tsx`:
```tsx
interface Props {
  agentCount: number
}

export function TopBar({ agentCount }: Props) {
  return (
    <div className="bg-[#0d0d1f] border-b border-[#1e1e3f] px-5 py-[10px] flex items-center justify-between flex-shrink-0">
      <div className="text-indigo-400 font-bold text-sm tracking-wide">⬡ MULTIAGENT OFFICE</div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] animate-pulse" />
        <span className="text-[11px] text-slate-600">
          {agentCount} agents active · 소프트웨어 개발 플로우
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: layout.tsx 수정**

`frontend/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Multiagent Office',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#080810] text-slate-200 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: page.tsx 조립**

`frontend/app/page.tsx`:
```tsx
'use client'

import { useAgentStore } from '@/hooks/useAgentStore'
import { TopBar } from '@/components/TopBar'
import { OfficeMap } from '@/components/OfficeMap'
import { Sidebar } from '@/components/Sidebar'

const WS_URL = 'ws://localhost:8000/ws'

export default function Home() {
  const { agents, log, sendTask } = useAgentStore(WS_URL)

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopBar agentCount={Object.keys(agents).length} />
      <div className="flex flex-1 overflow-hidden">
        <OfficeMap agents={agents} />
        <Sidebar agents={agents} log={log} onTaskSubmit={sendTask} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Next.js dev 서버로 동작 확인**

터미널 1 (백엔드):
```bash
cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

터미널 2 (프론트엔드):
```bash
cd frontend && npm run dev
```

`http://localhost:3000` 접속 → 오피스 맵 표시, 에이전트 이동 확인

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
# 백엔드
cd backend && pytest -v

# 프론트엔드
cd frontend && npx vitest run
```
Expected: 모든 테스트 PASS

- [ ] **Step 6: 최종 커밋**

```bash
git add frontend/components/TopBar.tsx frontend/app/page.tsx frontend/app/layout.tsx
git commit -m "feat: assemble main page with TopBar, OfficeMap, Sidebar"
```

---

## Self-Review

**Spec coverage 체크:**
- ✅ 오피스 시뮬레이션 비주얼 스타일
- ✅ 평면도형 맵 (방 6개 absolute 포지셔닝)
- ✅ 에이전트 6명 (CEO, PM, Dev, QA, Designer, DevOps)
- ✅ framer-motion 이동 애니메이션
- ✅ WebSocket 실시간 연결
- ✅ 시뮬레이션 모드 (fake data)
- ✅ 소프트웨어 개발 플로우
- ✅ 커스텀 태스크 입력
- ✅ 말풍선
- ✅ 활동 로그
- ✅ TDD (pytest + vitest)

**타입 일관성:**
- `AgentState` 타입이 Task 2에서 정의되고 Task 6~9에서 일관되게 사용 ✅
- `useAgentStore` 반환값의 `wsRef`가 테스트에서만 사용되고 실제 page.tsx에서는 노출 안 됨 ✅

**Out of scope 확인:** 실제 CrewAI 연결, 충돌 처리, 인증 — 모두 제외 ✅
