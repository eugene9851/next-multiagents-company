"use client"

import { useRef } from "react"
import { Mesh, Color } from "three"
import { Text } from "@react-three/drei"
import { ROOM_DEFS } from "@/constants/office"

interface RoomGroupProps {
  activeRooms: Set<string>
  onRoomClick: (roomId: string) => void
}

function RoomTile({
  room,
  isActive,
  onClick,
}: {
  room: (typeof ROOM_DEFS)[0]
  isActive: boolean
  onClick: () => void
}) {
  const meshRef = useRef<Mesh>(null)
  const [x, , z] = room.position
  const floorColor = "#" + new Color(room.color).multiplyScalar(isActive ? 1.4 : 0.5).getHexString()

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      {/* Floor tile */}
      <mesh ref={meshRef} position={[0, -0.05, 0]}>
        <boxGeometry args={[4.5, 0.1, 4.5]} />
        <meshStandardMaterial
          color={floorColor}
          emissive={isActive ? room.color : "#000000"}
          emissiveIntensity={isActive ? 0.3 : 0}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Low walls (4 sides) */}
      {[
        { pos: [0, 0.25, -2.3] as [number, number, number], size: [4.5, 0.5, 0.1] as [number, number, number] },
        { pos: [0, 0.25,  2.3] as [number, number, number], size: [4.5, 0.5, 0.1] as [number, number, number] },
        { pos: [-2.3, 0.25, 0] as [number, number, number], size: [0.1, 0.5, 4.5] as [number, number, number] },
        { pos: [ 2.3, 0.25, 0] as [number, number, number], size: [0.1, 0.5, 4.5] as [number, number, number] },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color={room.color} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Room label */}
      <Text
        position={[0, 0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.35}
        color={isActive ? "#ffffff" : room.color}
        anchorX="center"
        anchorY="middle"
      >
        {room.label}
      </Text>
    </group>
  )
}

export function RoomGroup({ activeRooms, onRoomClick }: RoomGroupProps) {
  return (
    <group>
      {/* Overall floor */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[24, 0.1, 24]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Grid helper */}
      <gridHelper args={[24, 24, "#1e293b", "#1e293b"]} position={[0, 0, 0]} />

      {/* Room tiles */}
      {ROOM_DEFS.map(room => (
        <RoomTile
          key={room.id}
          room={room}
          isActive={activeRooms.has(room.id)}
          onClick={() => onRoomClick(room.id)}
        />
      ))}
    </group>
  )
}
