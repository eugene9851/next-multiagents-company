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
