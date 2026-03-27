"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
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

function Scene({
  agents,
  selectedAgent,
  onAgentClick,
  onRoomClick,
}: OfficeCanvasProps) {
  const activeRooms = getActiveRooms(agents)

  return (
    <>
      <PerspectiveCamera makeDefault position={[14, 14, 14]} fov={60} near={0.1} far={200} />

      <OrbitControls
        enablePan={false}
        enableRotate={false}
        minDistance={8}
        maxDistance={40}
        target={[0, 0, 0]}
      />

      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} />
      <pointLight position={[0, 8, 0]} intensity={0.4} color="#6366f1" />

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
    </>
  )
}

export function OfficeCanvas(props: OfficeCanvasProps) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%", display: "block", background: "#080810" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x080810, 1)
      }}
    >
      <Scene {...props} />
    </Canvas>
  )
}
