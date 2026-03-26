interface Props {
  message: string
}

export function SpeechBubble({ message }: Props) {
  if (!message) return null
  return (
    <div className="absolute -top-12 left-0 bg-[#1e1e3f] border border-[#312e81] rounded-lg px-2 py-1 text-[9px] text-indigo-200 whitespace-normal max-w-[160px] z-10">
      {message}
      <div className="absolute -bottom-[5px] left-2 w-2 h-[5px] bg-[#1e1e3f] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
    </div>
  )
}
