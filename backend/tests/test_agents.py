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
