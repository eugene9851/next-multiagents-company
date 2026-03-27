"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { RoomGroup } from "./RoomGroup"
import { AgentCharacter } from "./AgentCharacter"
import { AGENT_DEFS, getRoomPosition } from "@/constants/office"
import type { AgentState, AgentId } from "@/types/agent"

interface OfficeCanvasProps {
  agents: Record<string, AgentState>
  selectedAgent: AgentId | null
  onAgentClick: (id: AgentId) => void
  onRoomClick: (roomId: string) => void
}

function getActiveRooms(agents: Record<string, AgentState>): Set<string> {
  const rooms = new Set<string>()
  for (const state of Object.values(agents)) {
    if (state.status !== "idle") {
      rooms.add(state.room)
    }
  }
  return rooms
}

export function OfficeCanvas({ agents, selectedAgent, onAgentClick, onRoomClick }: OfficeCanvasProps) {
  const activeRooms = getActiveRooms(agents)

  return (
    <Canvas
      shadows
      camera={{ position: [14, 14, 14], near: 0.1, far: 200 }}
      style={{ background: "#080810" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 8, 0]} intensity={0.4} color="#6366f1" />

      <OrbitControls
        enablePan={false}
        enableRotate={false}
        minDistance={8}
        maxDistance={40}
        target={[0, 0, 0]}
      />

      <RoomGroup activeRooms={activeRooms} onRoomClick={onRoomClick} />

      {AGENT_DEFS.map(def => {
        const state = agents[def.id]
        if (!state) return null
        const targetPos = getRoomPosition(state.room)

        return (
          <AgentCharacter
            key={def.id}
            agentId={def.id}
            role={def.role}
            color={def.color}
            targetPosition={targetPos}
            animState={state.animState}
            message={state.message}
            isSelected={selectedAgent === def.id}
            onClick={() => onAgentClick(def.id)}
          />
        )
      })}
    </Canvas>
  )
}
