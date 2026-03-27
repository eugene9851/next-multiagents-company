"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Html, Billboard } from "@react-three/drei"
import { Group, Color } from "three"
import { SpeechBubble } from "./SpeechBubble"
import type { AgentId, AnimState } from "@/types/agent"

interface AgentCharacterProps {
  agentId: AgentId
  role: string
  color: string
  targetPosition: [number, number, number]
  animState: AnimState
  message: string
  isSelected: boolean
  onClick: () => void
}

const WALK_SPEED = 0.06
const LEG_SWING = 0.5
const ARM_SWING = 0.3
const BOB_AMP = 0.04
const IDLE_BREATH = 0.015

export function AgentCharacter({
  agentId,
  role,
  color,
  targetPosition,
  animState,
  message,
  isSelected,
  onClick,
}: AgentCharacterProps) {
  const groupRef = useRef<Group>(null)
  const leftLegRef = useRef<Group>(null)
  const rightLegRef = useRef<Group>(null)
  const leftArmRef = useRef<Group>(null)
  const rightArmRef = useRef<Group>(null)
  const torsoRef = useRef<Group>(null)
  const posRef = useRef<[number, number, number]>([...targetPosition])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Position lerp toward target
    const cur = posRef.current
    const dx = targetPosition[0] - cur[0]
    const dz = targetPosition[2] - cur[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const isMoving = dist > 0.05

    if (isMoving) {
      cur[0] += dx * WALK_SPEED
      cur[2] += dz * WALK_SPEED
      groupRef.current.position.set(cur[0], cur[1], cur[2])
      groupRef.current.rotation.y = Math.atan2(dx, dz)
    } else {
      groupRef.current.position.set(targetPosition[0], targetPosition[1], targetPosition[2])
      posRef.current = [...targetPosition]
    }

    if (animState === "walk" || isMoving) {
      const legAngle = Math.sin(t * 8) * LEG_SWING
      if (leftLegRef.current) leftLegRef.current.rotation.x = legAngle
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legAngle
      const armAngle = Math.sin(t * 8) * ARM_SWING
      if (leftArmRef.current) leftArmRef.current.rotation.x = -armAngle
      if (rightArmRef.current) rightArmRef.current.rotation.x = armAngle
      if (torsoRef.current) torsoRef.current.position.y = Math.abs(Math.sin(t * 8)) * BOB_AMP
    } else if (animState === "work") {
      const workAngle = Math.sin(t * 5) * 0.2 - 0.3
      if (leftArmRef.current) leftArmRef.current.rotation.x = workAngle
      if (rightArmRef.current) rightArmRef.current.rotation.x = workAngle
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
      if (torsoRef.current) torsoRef.current.position.y = Math.sin(t * 2) * IDLE_BREATH
    } else {
      // idle: breathing
      const breathAngle = Math.sin(t * 1.5) * 0.05
      if (leftArmRef.current) leftArmRef.current.rotation.x = breathAngle
      if (rightArmRef.current) rightArmRef.current.rotation.x = breathAngle
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
      if (torsoRef.current) torsoRef.current.position.y = Math.sin(t * 1.5) * IDLE_BREATH
    }
  })

  const pantsColor = "#" + new Color(color).multiplyScalar(0.6).getHexString()
  const selectedScale: [number, number, number] = isSelected ? [1.15, 1.15, 1.15] : [1, 1, 1]

  return (
    <group ref={groupRef} onClick={onClick} scale={selectedScale}>
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Torso group for breathing animation */}
      <group ref={torsoRef}>
        {/* Head */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.6} />
        </mesh>

        {/* Eyes */}
        <mesh position={[0.09, 1.65, 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.09, 1.65, 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Torso */}
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[0.38, 0.5, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>

        {/* Left arm */}
        <group ref={leftArmRef} position={[-0.28, 1.25, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rightArmRef} position={[0.28, 1.25, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.07, 0.35, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>

        {/* Left leg */}
        <group ref={leftLegRef} position={[-0.12, 0.78, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.8} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[0.12, 0.78, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.08, 0.45, 4, 8]} />
            <meshStandardMaterial color={pantsColor} roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Name badge - always faces camera */}
      <Billboard position={[0, 2.0, 0]}>
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: color,
              color: "#ffffff",
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
              boxShadow: `0 2px 8px ${color}66`,
            }}
          >
            {role}
          </div>
        </Html>
      </Billboard>

      {/* Speech bubble */}
      <SpeechBubble message={message} color={color} />
    </group>
  )
}
