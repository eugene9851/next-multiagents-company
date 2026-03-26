

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
