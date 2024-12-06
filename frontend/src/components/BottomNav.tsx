'use client'

import { Home, Send, Wallet, Settings, Contact, Contact2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex justify-around items-center h-16">
        <NavItem href="/" icon={Home} label="Home" isActive={pathname === '/'} />
        <NavItem href="/send" icon={Send} label="Send" isActive={pathname === '/send'} />
        {/* <NavItem
          href="/contacts"
          icon={Contact2}
          label="Contacts"
          isActive={pathname === '/contacts'}
        /> */}
        <NavItem href="/wallet" icon={Wallet} label="Wallet" isActive={pathname === '/wallet'} />
        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          isActive={pathname === '/settings'}
        />
      </div>
    </nav>
  )
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive
}: {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs mt-1">{label}</span>
    </Link>
  )
}
