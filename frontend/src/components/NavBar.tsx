'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ModeToggle } from '@/components/ui/theme-button'

import ctrl from '@/app/_assets/ctrl.svg'

const Navbar = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex flex-row items-center gap-2 justify-between h-16">
        <div className="flex flex-col gap-4">
          <span className="tracking-tighter text-xl font-extrabold text-primary flex gap-2 items-center">
            <Image src={ctrl} alt="ctrl" width={40} data-testid="ctrl-image" className="p-2" />
            Solana wallet
          </span>
        </div>
        <ModeToggle />
      </div>
    </nav>
  )
}

export default Navbar
