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

// Singleton orchestrator instance (prevents multiple concurrent runs)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orchestratorInstance: any | null = null

async function getOrchestratorInstance() {
  if (!orchestratorInstance) {
    const { FlowOrchestrator } = await import("./flowOrchestrator")
    orchestratorInstance = new FlowOrchestrator(broadcast)
  }
  return orchestratorInstance
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
      if (
        msg.type === "start_task" &&
        typeof msg.description === "string" &&
        msg.description.length > 0 &&
        msg.description.length <= 2000
      ) {
        const workDir = typeof msg.workDir === "string" && msg.workDir.trim().length > 0
          ? msg.workDir.trim()
          : undefined
        const orch = await getOrchestratorInstance()
        orch.run(msg.description, workDir).catch(console.error)
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
