# Multi-Agent Office Game — Design Spec
Date: 2026-03-26

## Overview

6명의 AI 에이전트가 가상 오피스 평면도 위를 돌아다니며 소프트웨어 개발 플로우를 시뮬레이션하는 게임형 UI. Next.js + FastAPI + WebSocket 기반. CrewAI 연결은 추후 확장 예정이며, MVP는 시뮬레이션 모드로 동작.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, framer-motion |
| Backend  | FastAPI, Python, asyncio |
| Transport | WebSocket (`ws://localhost:8000/ws`) |
| Simulation | Python async loop (가짜 CrewAI, 추후 실제 연결) |

---

## Agents (6명)

| ID       | Role     | Emoji | Color    | Home Room  |
|----------|----------|-------|----------|------------|
| ceo      | CEO      | 👔    | #eab308  | ceo_office |
| pm       | PM       | 🧠    | #6366f1  | pm_zone    |
| dev      | Dev      | ⚙️    | #0ea5e9  | dev_zone   |
| qa       | QA       | 🔬    | #a855f7  | qa_zone    |
| designer | Designer | 🎨    | #22c55e  | design     |
| devops   | DevOps   | 🚀    | #f97316  | meeting    |

---

## Office Map — Room Coordinates

```python
ROOMS = {
    "pm_zone":    {"x": 68,  "y": 60},
    "dev_zone":   {"x": 580, "y": 60},
    "meeting":    {"x": 330, "y": 270},
    "qa_zone":    {"x": 68,  "y": 420},
    "design":     {"x": 580, "y": 390},
    "ceo_office": {"x": 580, "y": 480},
}
```

맵은 CSS grid-background 위에 absolute-positioned div 방들로 구성. 각 방은 라벨 + 이모지 표시.

---

## WebSocket Message Schema

```ts
interface AgentState {
  id: string        // "pm", "dev", etc.
  role: string      // "PM", "Dev", etc.
  emoji: string     // "🧠"
  room: string      // "pm_zone"
  x: number         // px absolute position
  y: number
  status: "active" | "idle" | "meeting"
  message: string   // 말풍선 텍스트
  color: string     // hex
}
```

서버는 에이전트 상태 변경 시마다 해당 에이전트의 `AgentState`를 브로드캐스트.
클라이언트는 `id` 기준으로 upsert.

---

## Simulation Flow (기본 — 소프트웨어 개발)

| 단계 | 에이전트 | 이동 위치 | 메시지 |
|------|---------|---------|--------|
| 1 | CEO | ceo_office | "태스크 승인" |
| 2 | PM | pm_zone | "요구사항 분석 중..." |
| 3 | PM + CEO | meeting | "방향 싱크" |
| 4 | Designer | design | "UI 설계 중..." |
| 5 | PM | dev_zone | "스펙 전달" |
| 6 | Dev | dev_zone | "코딩 중..." |
| 7 | QA | qa_zone | "테스트 중..." |
| 8 | DevOps | meeting | "배포 준비" |
| 9 | CEO | meeting | "최종 확인" |

각 단계 사이에 `asyncio.sleep(2~3초)` 딜레이. 전체 루프 완료 후 반복 or 대기.

**커스텀 태스크:** 클라이언트가 `{ type: "task", description: "..." }`를 서버로 전송하면 동일 플로우를 해당 태스크 텍스트로 재실행.

---

## Frontend Components

### `OfficeMap`
- 전체 화면 배경 (CSS grid dot pattern)
- `Room` 컴포넌트들을 absolute 포지셔닝으로 배치
- `AgentDot` 컴포넌트들을 오버레이

### `AgentDot`
- framer-motion `animate={{ x, y }}` + `transition={{ type: "tween", duration: 0.8, ease: "easeInOut" }}`
- 에이전트 이모지 + 이름 레이블
- `SpeechBubble` (message 있을 때만 표시)

### `SpeechBubble`
- AgentDot 위에 absolute 포지셔닝
- framer-motion `AnimatePresence`로 fade in/out

### `Sidebar`
- **TaskPanel:** textarea + "시뮬레이션 시작" 버튼 → WebSocket으로 전송
- **AgentStatusList:** 6명 에이전트 상태 (role, status badge, 현재 메시지)
- **ActivityLog:** 이벤트 로그 스크롤 영역

### `TopBar`
- 로고, 라이브 상태 표시 (에이전트 수 + 현재 플로우명)

---

## Backend Structure

```
main.py
├── WebSocket endpoint (/ws)
│   ├── ConnectionManager — 클라이언트 연결/해제 관리
│   └── 메시지 수신 → task 이벤트 처리
├── SimEngine
│   ├── run_default_flow() — 기본 개발 플로우
│   ├── run_custom_flow(description) — 커스텀 태스크
│   └── broadcast_state(agent_id, updates) — 상태 브로드캐스트
└── AGENT_REGISTRY — 에이전트 초기 상태 딕셔너리
```

---

## File Structure

```
next-multiagents-company/
├── frontend/                  # Next.js 앱
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx           # 메인 페이지
│   ├── components/
│   │   ├── OfficeMap.tsx
│   │   ├── AgentDot.tsx
│   │   ├── SpeechBubble.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TaskPanel.tsx
│   │   ├── AgentStatusList.tsx
│   │   └── ActivityLog.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts    # WS 연결 + 상태 관리
│   └── types/
│       └── agent.ts           # AgentState 타입
├── backend/
│   ├── main.py                # FastAPI 앱
│   ├── sim_engine.py          # 시뮬레이션 루프
│   └── agents.py              # 에이전트 레지스트리
└── docs/
    └── superpowers/specs/
        └── 2026-03-26-multiagent-office-game-design.md
```

---

## Out of Scope (MVP)

- 실제 CrewAI 연결 (추후 확장)
- 에이전트 간 충돌 처리 / 경로 탐색
- 인증 / 멀티 세션
- Phaser/PixiJS 교체
- 모바일 대응
