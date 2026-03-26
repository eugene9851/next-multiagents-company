import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Multiagent Office',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#080810] text-slate-200 antialiased">{children}</body>
    </html>
  )
}
