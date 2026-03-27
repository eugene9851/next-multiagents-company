"use client"

import dynamic from "next/dynamic"
import { Sidebar } from "@/components/Sidebar"
import { useOfficeSocket } from "@/hooks/useOfficeSocket"
import type { AgentId } from "@/types/agent"

// R3F Canvas must not SSR — it uses WebGL APIs
const OfficeCanvas = dynamic(
  () => import("@/components/OfficeCanvas").then(m => m.OfficeCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080810",
        }}
      >
        <p style={{ color: "#475569", fontFamily: "monospace", fontSize: "14px" }}>
          오피스 로딩 중...
        </p>
      </div>
    ),
  }
)

const WS_URL = "ws://localhost:3001"

export default function Home() {
  const {
    agents,
    outputChunks,
    log,
    selectedAgent,
    connected,
    projectDir,
    sendTask,
    selectAgent,
  } = useOfficeSocket(WS_URL)

  function handleAgentClick(id: AgentId) {
    selectAgent(id)
  }

  function handleRoomClick(roomId: string) {
    const agentInRoom = Object.values(agents).find(a => a.room === roomId)
    if (agentInRoom) selectAgent(agentInRoom.id)
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, position: "relative", minWidth: 0, height: "100%" }}>
        <OfficeCanvas
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentClick={handleAgentClick}
          onRoomClick={handleRoomClick}
        />
      </div>

      <Sidebar
        agents={agents}
        outputChunks={outputChunks}
        log={log}
        selectedAgent={selectedAgent}
        connected={connected}
        projectDir={projectDir}
        onTaskSubmit={sendTask}
        onSelectAgent={selectAgent}
      />
    </div>
  )
}
