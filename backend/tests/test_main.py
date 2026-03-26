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
        # 에러 없이 처리됨
