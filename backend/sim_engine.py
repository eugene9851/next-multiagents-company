import asyncio
from typing import Callable, Awaitable
from agents import build_initial_agents, ROOMS, AGENT_CONFIGS


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
        for cfg in AGENT_CONFIGS:
            await self.idle_agent(cfg["id"])
            await asyncio.sleep(0.3)

    async def start_loop(self) -> None:
        self._running = True
        while self._running:
            await self.run_flow()
            await asyncio.sleep(3)

    def stop(self) -> None:
        self._running = False
