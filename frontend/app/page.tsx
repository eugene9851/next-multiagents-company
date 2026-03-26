'use client'

import { useAgentStore } from '@/hooks/useAgentStore'
import { TopBar } from '@/components/TopBar'
import { OfficeMap } from '@/components/OfficeMap'
import { Sidebar } from '@/components/Sidebar'

const WS_URL = 'ws://localhost:8000/ws'

export default function Home() {
  const { agents, log, sendTask } = useAgentStore(WS_URL)

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <TopBar agentCount={Object.keys(agents).length} />
      <div className="flex flex-1 overflow-hidden">
        <OfficeMap agents={agents} />
        <Sidebar agents={agents} log={log} onTaskSubmit={sendTask} />
      </div>
    </div>
  )
}
