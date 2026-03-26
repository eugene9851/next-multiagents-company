import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from agents import build_initial_agents, ROOMS, AGENT_CONFIGS
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
    engine.agents["pm"]["room"] = "meeting"
    await engine.idle_agent("pm")
    assert engine.agents["pm"]["status"] == "idle"
    assert engine.agents["pm"]["message"] == ""
    # Should return to home room
    assert engine.agents["pm"]["room"] == "pm_zone"
    assert engine.agents["pm"]["x"] == ROOMS["pm_zone"]["x"]
    assert engine.agents["pm"]["y"] == ROOMS["pm_zone"]["y"]

@pytest.mark.asyncio
async def test_set_task_resets_on_next_run(engine):
    engine.set_task("로그인 기능 구현")
    assert engine.current_task == "로그인 기능 구현"
