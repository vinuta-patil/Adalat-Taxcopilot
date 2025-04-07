import React from 'react'
import Link from 'next/link'
import { Gavel } from 'lucide-react'
import { Button } from './ui/button'

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel className="h-6 w-6" />
          <Link href="/" className="text-xl font-bold">
            Tax Litigation CoPilot
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/analysis">
            <Button variant="ghost">New Analysis</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
