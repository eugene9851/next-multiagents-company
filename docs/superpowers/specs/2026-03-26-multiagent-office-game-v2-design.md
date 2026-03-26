# Multi-Agent Office Game v2 — Design Spec
Date: 2026-03-26

## Overview

6명의 AI 에이전트가 가상 오피스 평면도 위를 돌아다니며 실제 소프트웨어 개발 산출물을 생성하는 게임형 UI. 사용자가 태스크를 입력하면, CEO→PM→Designer→Dev→QA→DevOps 순서로 각 에이전트가 Claude Code(`@anthropic-ai/claude-agent-sdk`)를 통해 실제 문서/코드를 생성하고, 결과가 파일로 저장되며 UI에 실시간 스트리밍된다.

**기존 v1과의 차이:**
- FastAPI (Python) → Node.js + TypeScript
- 시뮬레이션(가짜 메시지) → 실제 Claude Code 실행
- framer-motion → PixiJS (WebGL 2D 렌더링)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, PixiJS |
| Server | Node.js + TypeScript, ws (WebSocket), express |
| AI Layer | `@anthropic-ai/claude-agent-sdk` (Claude Code, no API key) |
| Transport | WebSocket (`ws://localhost:3001`) |
| Output | `outputs/{taskId}/{agent}.md` 파일 저장 |

---

## Project Structure

```
next-multiagents-company/
├── frontend/                  # Next.js 16 (기존 유지, 코드만 교체)
│   ├── app/page.tsx           # PixiJS canvas 마운트
│   ├── components/
│   │   ├── OfficeCanvas.tsx   # PixiJS 메인 컴포넌트
│   │   └── Sidebar.tsx        # 태스크 입력 + 결과 로그
│   ├── hooks/useAgentStore.ts # WebSocket 상태 관리
│   └── constants/office.ts   # 방 좌표, 에이전트 설정
├── server/                    # Node.js 서버 (새로 생성)
│   ├── index.ts               # WebSocket 서버 + HTTP API
│   ├── orchestrator.ts        # 에이전트 순차 실행 관리
│   └── agents/
│       ├── base.ts            # 공통 에이전트 로직
│       ├── ceo.ts
│       ├── pm.ts
│       ├── designer.ts
│       ├── dev.ts
│       ├── qa.ts
│       └── devops.ts
├── outputs/                   # 에이전트 산출물 저장
└── package.json               # concurrently dev script
```

**삭제:** `backend/` 전체 (FastAPI, Python)

---

## Agents (6명)

| ID | Role | Emoji | Color | Home Room | 출력 파일 |
|----|------|-------|-------|-----------|----------|
| ceo | CEO | 👔 | #eab308 | ceo_office | `ceo_approval.md` |
| pm | PM | 🧠 | #6366f1 | pm_zone | `requirements.md` |
| designer | Designer | 🎨 | #22c55e | design | `ui_spec.md` |
| dev | Dev | ⚙️ | #0ea5e9 | dev_zone | `implementation.md` |
| qa | QA | 🔬 | #a855f7 | qa_zone | `test_cases.md` |
| devops | DevOps | 🚀 | #f97316 | meeting | `deploy_script.md` |

---

## Office Map — Room Coordinates

```typescript
export const ROOMS = {
  pm_zone:    { x: 68,  y: 60,  label: "PM Zone",     icon: "🧠" },
  dev_zone:   { x: 580, y: 60,  label: "Dev Zone",    icon: "⚙️" },
  meeting:    { x: 330, y: 270, label: "Meeting",     icon: "🤝" },
  qa_zone:    { x: 68,  y: 420, label: "QA Zone",     icon: "🔬" },
  design:     { x: 580, y: 390, label: "Design",      icon: "🎨" },
  ceo_office: { x: 580, y: 480, label: "CEO Office",  icon: "👔" },
}
```

캔버스 크기: 800×600

---

## WebSocket Event Protocol

### Server → Client

```typescript
// 에이전트 이동
{ type: "agent_move", agentId: string, room: string, x: number, y: number, status: "active" | "idle" }

// 에이전트 스트리밍 텍스트 (말풍선)
{ type: "agent_stream", agentId: string, chunk: string }

// 에이전트 작업 완료
{ type: "agent_done", agentId: string, outputPath: string }

// 전체 태스크 완료
{ type: "task_complete", outputs: Record<string, string> }

// 에러
{ type: "error", message: string }
```

### Client → Server

```typescript
// 태스크 시작
{ type: "task_start", description: string }
```

---

## Sequential Agent Pipeline

```
사용자 태스크 입력
       ↓
CEO: 태스크 승인 + 방향 제시 → ceo_approval.md
       ↓
PM: 요구사항 분석 (ceo_approval.md 참조) → requirements.md
       ↓
Designer: UI 설계 (requirements.md 참조) → ui_spec.md
       ↓
Dev: 구현 계획 (requirements.md + ui_spec.md 참조) → implementation.md
       ↓
QA: 테스트 케이스 (implementation.md 참조) → test_cases.md
       ↓
DevOps: 배포 스크립트 (implementation.md 참조) → deploy_script.md
```

각 에이전트 실행 시:
1. WebSocket `agent_move` 이벤트 → PixiJS 에이전트 이동
2. `query()` 스트리밍 → `agent_stream` 청크 전송 → 말풍선 업데이트
3. 완료 → 파일 저장 → `agent_done` 이벤트

---

## PixiJS 렌더링

### 에이전트 스프라이트

```
AgentSprite (Container)
├── circle (Graphics)    - 색상 원 (radius: 20)
├── emoji (Text)         - 이모지 (fontSize: 20, centered)
├── nameLabel (Text)     - 역할명 (fontSize: 10, 아래)
└── bubble (Container)
    ├── bg (Graphics)    - 말풍선 배경 (흰색 둥근 사각형)
    └── text (Text)      - 스트리밍 텍스트 (maxWidth: 160)
```

### 이동 애니메이션

```typescript
// ticker per frame
agent.x += (agent.targetX - agent.x) * 0.08
agent.y += (agent.targetY - agent.y) * 0.08
```

### 방 렌더링

```
RoomGraphic (Container)
├── bg (Graphics)    - 반투명 사각형 (120×80)
├── icon (Text)      - 이모지
└── label (Text)     - 방 이름
```

배경: 도트 그리드 (10px 간격, 연한 회색)

---

## 에이전트 프롬프트 설계

각 에이전트는 역할에 맞는 시스템 프롬프트 + 이전 산출물을 컨텍스트로 받아 작업.

**CEO 프롬프트 (예시):**
```
당신은 스타트업 CEO입니다. 다음 태스크를 검토하고 승인 여부와 개발 방향을 결정하세요.
태스크: {taskDescription}
출력: 마크다운으로 (1) 승인 여부 (2) 핵심 방향 3가지 (3) 우선순위를 작성하세요.
```

**PM 프롬프트 (예시):**
```
당신은 PM입니다. CEO 승인서를 바탕으로 요구사항 문서를 작성하세요.
CEO 승인서: {ceoApproval}
출력: 마크다운으로 (1) 기능 목록 (2) 비기능 요구사항 (3) 마일스톤을 작성하세요.
```

---

## 에러 처리

- `query()` 실패 시: `error` WebSocket 이벤트 + 해당 에이전트 idle 복귀
- 파일 저장 실패 시: 로그만 남기고 계속 진행 (출력은 WebSocket으로 이미 전달됨)
- WebSocket 연결 끊김: 프론트엔드에서 3초 후 재연결 시도

---

## 개발/실행 환경

```bash
npm run dev  # concurrently: frontend(3000) + server(3001)
```

`@anthropic-ai/claude-agent-sdk`는 현재 Claude Code 세션을 재사용하므로 별도 API 키 불필요.
