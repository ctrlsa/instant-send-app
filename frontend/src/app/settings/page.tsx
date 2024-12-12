'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, ExternalLink, List, Info, HelpCircle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/contexts/WalletContext'
import { useInitData } from '@telegram-apps/sdk-react'
import { checkPasswordExists } from '@/utils/auth'

const settingsOptions = [
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    path: '/settings/general'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Lock,
    path: '/settings/security'
  },
  {
    id: 'explorer',
    label: 'View wallet on explorer',
    icon: ExternalLink,
    external: true
  },
  {
    id: 'transactions',
    label: 'View wallet transactions',
    icon: List,
    path: '/transactions'
  },
  {
    id: 'support',
    label: 'Support',
    icon: HelpCircle,
    path: '/settings/support'
  },
  { id: 'about', label: 'About', icon: Info, path: '/settings/about' }
]

const SettingsPage = () => {
  const [selectedOption, setSelectedOption] = useState('general')
  const [hasPassword, setHasPassword] = useState(false)
  const router = useRouter()
  const { walletSolana } = useWallet()
  const initData = useInitData()

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id } = initData.user
    return { id: id.toString() }
  }, [initData])

  // Check if user has password
  useEffect(() => {
    if (currentUser) {
      checkPasswordExists(currentUser.id).then(setHasPassword)
    }
  }, [currentUser])

  const handleOptionClick = (option: (typeof settingsOptions)[0]) => {
    setSelectedOption(option.id)
    if (option.external) {
      if (walletSolana) {
        window.open(`https://explorer.solana.com/address/${walletSolana.publicKey}`, '_blank')
      } else {
        console.error('Wallet is not connected')
      }
    } else if (option.path && router) {
      router.push(option.path)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 flex justify-end items-center h-[70vh]"
    >
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="w-full">
              <nav className="space-y-2">
                {settingsOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedOption === option.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => handleOptionClick(option)}
                  >
                    <option.icon className="mr-2 h-4 w-4" />
                    {option.label}
                    {option.id === 'security' && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {hasPassword ? 'Protected' : 'Not Protected'}
                      </span>
                    )}
                  </Button>
                ))}
              </nav>
            </div>
            <Separator orientation="vertical" className="hidden md:block" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default SettingsPage
