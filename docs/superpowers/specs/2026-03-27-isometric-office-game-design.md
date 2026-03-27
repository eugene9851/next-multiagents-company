# Isometric Office Game — Design Spec
Date: 2026-03-27

## Overview

6명의 AI 에이전트가 CSS 3D 아이소메트릭 오피스 안에서 캐릭터로 움직이며 실제 gstack 커맨드를 실행하는 게임형 UI. 유저는 CEO로서 태스크를 입력하면, PM → CEO리뷰 → Designer → Dev → QA → DevOps 순서로 각 캐릭터가 실제 `claude` CLI + gstack 슬래시 커맨드를 실행하고, 결과가 말풍선 + 사이드 패널로 실시간 스트리밍된다.

기존 프로젝트 파일(frontend 컴포넌트, Python 백엔드)은 전부 교체한다.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, framer-motion |
| Backend | Node.js + TypeScript, Express, ws (WebSocket) |
| AI 실행 | `claude` CLI subprocess (gstack 슬래시 커맨드) |
| Transport | WebSocket (`ws://localhost:3001`) |

---

## Agents — gstack 매핑

| ID | 캐릭터 | 이모지 | gstack 커맨드 | 홈 방 |
|----|--------|--------|--------------|------|
| ceo | CEO | 😎 | `/plan-ceo-review` | ceo_office |
| pm | PM | 🧠 | `/office-hours` | pm_zone |
| designer | Designer | 🎨 | `/plan-design-review` | design_zone |
| dev | Dev | ⚙️ | `/plan-eng-review` + build | dev_zone |
| qa | QA | 🔬 | `/qa` | qa_zone |
| devops | DevOps | 🚀 | `/ship` | devops_zone |

---

## 실행 파이프라인

```
CEO 태스크 입력
  → PM: /office-hours (요구사항 발견)
  → CEO: /plan-ceo-review (비즈니스 리뷰)
  → Designer: /plan-design-review (디자인 리뷰)
  → Dev: /plan-eng-review (엔지니어링 리뷰) + build
  → QA: /qa (브라우저 테스트)
  → DevOps: /ship (PR 오픈)
  → 완료
```

각 단계 사이에 에이전트 캐릭터가 해당 방으로 이동하는 애니메이션이 재생된다.

---

## 오피스 맵 — 방 구성

6개의 CSS 3D 아이소메트릭 룸 (skew transform 기반):

```
       [CEO 오피스]
  [PM 존]  [미팅룸]  [Dev 존]
  [QA 존]           [Design 존]
                    [DevOps 존]
```

각 방은 반투명 컬러 배경 + 역할 아이콘 + 이름 레이블. 캐릭터가 방에 도착하면 방이 살짝 하이라이트된다.

---

## WebSocket 메시지 스키마

### 서버 → 클라이언트

```ts
interface AgentEvent {
  type: "agent_update" | "stream_chunk" | "agent_done" | "flow_complete" | "error"
  agentId: "ceo" | "pm" | "designer" | "dev" | "qa" | "devops"
  status: "idle" | "running" | "done" | "moving" | "error"
  room: string       // 현재 위치한 방 ID
  message: string    // 말풍선에 표시할 짧은 요약 텍스트
  chunk?: string     // 스트리밍 출력 청크 (stream_chunk 타입)
}
```

### 클라이언트 → 서버

```ts
interface TaskMessage {
  type: "start_task"
  description: string  // CEO가 입력한 태스크 내용
}
```

---

## Frontend 컴포넌트

### `IsometricOffice`
- 전체 오피스 맵 컨테이너
- `IsoRoom` 6개를 absolute 포지셔닝으로 배치
- `Character` 컴포넌트들을 오버레이 (framer-motion으로 방 사이 이동)

### `IsoRoom`
- CSS skewX(-30deg) scaleY(0.7) 아이소메트릭 타일
- 활성화 시 border glow 효과
- 클릭 시 해당 방 에이전트의 OutputPanel 포커스

### `Character`
- 에이전트 이모지 + 이름 뱃지
- `framer-motion animate={{ x, y }}` 로 방 간 이동
- 실행 중 bounce/pulse 애니메이션
- `SpeechBubble` (message 있을 때만 AnimatePresence로 fade in/out)

### `Sidebar`
- **TaskInput**: CEO 태스크 textarea + "팀에게 지시" 버튼
- **AgentStatusList**: 6명 상태 (이모지, 역할, 배지, 현재 메시지)
- **OutputPanel**: 클릭된 캐릭터의 gstack 출력 실시간 스트리밍
- **ActivityLog**: 타임스탬프 + 에이전트 + 이벤트 로그

### `useOfficeSocket`
- WebSocket 연결/재연결 (3초 interval)
- `AgentState` 맵 관리 (id → state)
- `outputChunks` 맵 관리 (id → 누적 출력)
- `selectedAgent` 상태 (OutputPanel 포커스)

---

## Backend 구조

```
backend/
├── server.ts           # Express + WebSocket 서버 (port 3001)
├── gstackRunner.ts     # claude CLI subprocess 실행 + stdout 스트리밍
├── flowOrchestrator.ts # 에이전트 순서 조율, 단계별 실행
├── agents.ts           # 에이전트 정의 + gstack 커맨드 + 방 좌표
└── package.json        # ts-node, express, ws, @types/*
```

### gstack 실행 방식

```ts
// gstackRunner.ts
import { spawn } from "child_process"

function runGstackCommand(agentId: string, taskDescription: string, onChunk: (chunk: string) => void) {
  const prompt = buildGstackPrompt(agentId, taskDescription) // gstack 슬래시 커맨드 프롬프트 생성
  const proc = spawn("claude", ["--print", "--dangerously-skip-permissions", prompt])
  proc.stdout.on("data", (data) => onChunk(data.toString()))
  return proc
}
```

### 에러 처리

- `claude` CLI 없을 때: 클라이언트에 `error` 이벤트 전송 + 시뮬레이션 모드 폴백
- gstack 커맨드 실패 (exit code ≠ 0): 해당 에이전트 `error` 상태, 파이프라인 중단
- WebSocket 클라이언트 연결 끊김: 진행 중인 subprocess 유지, 재연결 시 현재 상태 전송

---

## 파일 구조

```
next-multiagents-company/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── IsometricOffice.tsx
│   │   ├── IsoRoom.tsx
│   │   ├── Character.tsx
│   │   ├── SpeechBubble.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TaskInput.tsx
│   │   ├── AgentStatusList.tsx
│   │   ├── OutputPanel.tsx
│   │   └── ActivityLog.tsx
│   ├── hooks/
│   │   └── useOfficeSocket.ts
│   └── types/
│       └── agent.ts
└── backend/
    ├── server.ts
    ├── gstackRunner.ts
    ├── flowOrchestrator.ts
    ├── agents.ts
    └── package.json
```

---

## MVP 범위

**포함:**
- CSS 3D 아이소메트릭 오피스 맵 + 6개 방
- 캐릭터 이동 애니메이션 (framer-motion)
- 말풍선 스트리밍 + 사이드 패널 풀 출력
- CEO 태스크 입력 → gstack 파이프라인 자동 실행
- WebSocket 실시간 상태 동기화
- Python 백엔드 → Node.js TypeScript 교체

**제외 (추후):**
- 캐릭터 간 충돌/경로 탐색 알고리즘
- 모바일 반응형
- 멀티 세션 / 인증
- gstack `/review`, `/retro` 등 추가 커맨드 연동
