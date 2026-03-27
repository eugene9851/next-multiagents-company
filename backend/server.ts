import express from "express"
import { WebSocketServer, WebSocket } from "ws"
import { createServer } from "http"
import { AGENTS, ROOMS } from "./agents"
import type { AgentEvent } from "./types"

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

// Active WebSocket clients
const clients = new Set<WebSocket>()

export function broadcast(event: AgentEvent): void {
  const msg = JSON.stringify(event)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  }
}

// Lazy-load orchestrator to avoid circular deps
let orchestratorPromise: Promise<{ FlowOrchestrator: any }> | null = null
function getOrchestrator() {
  if (!orchestratorPromise) {
    orchestratorPromise = import("./flowOrchestrator")
  }
  return orchestratorPromise
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", agents: AGENTS.length, rooms: ROOMS.length })
})

wss.on("connection", (ws) => {
  clients.add(ws)

  // Send initial agent states on connect
  for (const agent of AGENTS) {
    const event: AgentEvent = {
      type: "agent_update",
      agentId: agent.id,
      status: "idle",
      animState: "idle",
      room: agent.homeRoom,
      message: "",
    }
    ws.send(JSON.stringify(event))
  }

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === "start_task" && typeof msg.description === "string") {
        const { FlowOrchestrator } = await getOrchestrator()
        const orch = new FlowOrchestrator(broadcast)
        orch.run(msg.description).catch(console.error)
      }
    } catch {
      // ignore malformed messages
    }
  })

  ws.on("close", () => clients.delete(ws))
  ws.on("error", () => clients.delete(ws))
})

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
