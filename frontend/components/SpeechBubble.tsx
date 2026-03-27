"use client"

import { Html } from "@react-three/drei"

interface SpeechBubbleProps {
  message: string
  color: string
}

export function SpeechBubble({ message, color }: SpeechBubbleProps) {
  if (!message) return null

  return (
    <Html
      position={[0, 2.4, 0]}
      center
      distanceFactor={8}
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          background: "rgba(10,15,26,0.95)",
          border: `1px solid ${color}`,
          borderRadius: "8px",
          padding: "4px 10px",
          fontSize: "11px",
          color: color,
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          maxWidth: "180px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          backdropFilter: "blur(8px)",
          boxShadow: `0 0 12px ${color}33`,
        }}
      >
        {message}
        <span
          style={{
            display: "inline-block",
            width: "6px",
            animation: "blink 1s step-end infinite",
            marginLeft: "2px",
          }}
        >
          ▋
        </span>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </Html>
  )
}
