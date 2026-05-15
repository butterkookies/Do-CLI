import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'do.',
  description: 'keyboard-first task manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="scanlines" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
