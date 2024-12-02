// src/components/WalletGenerator.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Copy, Info } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

import {
  generateWalletFromMnemonic,
  Wallet,
  createMnemonic,
  validateWalletMnemonic
} from '../utils/wallet'
import { walletApi } from '@/services/api'
import Link from 'next/link'

interface WalletGeneratorProps {
  wallet: Wallet | null
  onWalletCreated: (wallet: Wallet) => void
  user: any
}

const WalletGenerator: React.FC<WalletGeneratorProps> = ({ wallet, onWalletCreated, user }) => {
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(' '))
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false)
  const [mnemonicInput, setMnemonicInput] = useState<string>('')
  const [visiblePrivateKey, setVisiblePrivateKey] = useState<boolean>(false)

  const [countdown, setCountdown] = useState<number | null>(null)

  // Path type specific to Solana
  const pathType = '501'
  const pathTypeName = 'Solana'

  useEffect(() => {
    setVisiblePrivateKey(false)
  }, [])

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  const handleGenerateWallet = async () => {
    if (wallet) {
      toast.error('A wallet already exists for this network.')
      return
    }

    let mnemonic = mnemonicInput.trim()

    if (mnemonic) {
      if (!validateWalletMnemonic(mnemonic)) {
        toast.error('Invalid recovery phrase. Please try again.')
        return
      }
    } else {
      mnemonic = createMnemonic()
    }

    const words = mnemonic.split(' ')
    setMnemonicWords(words)
    setShowMnemonic(true) // Only show the mnemonic immediately after generation
    setCountdown(60) // Start countdown at 60 seconds
    try {
      const newWallet = generateWalletFromMnemonic(pathType, mnemonic, 0) // Only 1 account (index 0)
      if (newWallet) {
        onWalletCreated(newWallet)
        await walletApi.addWallet(user.id, user.name, newWallet.publicKey)

        toast.success('Wallet generated successfully!')

        // Clear mnemonic after 60 seconds
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev === 1) {
              clearInterval(timer)
              setMnemonicWords(Array(12).fill(' '))
              setShowMnemonic(false)
              return null
            }
            return prev! - 1
          })
        }, 1000)
      }
    } catch (e) {
      toast.error('Error generating wallet. Please try again.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!wallet && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex flex-col gap-4 my-12"
            >
              <div className="flex flex-col gap-2">
                <h1 className="tracking-tighter text-4xl md:text-5xl font-black">
                  Create Solana Wallet
                </h1>
              </div>

              <Alert className="bg-muted">
                <Info className="h-4 w-4" />
                <AlertTitle>About Recovery Phrases</AlertTitle>
                <AlertDescription className="mt-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>You can back it up later from Security Settings</li>
                    <li>Never share your recovery phrase with anyone</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="password"
                  placeholder="Enter your secret phrase (or leave blank to generate)"
                  onChange={(e) => setMnemonicInput(e.target.value)}
                  value={mnemonicInput}
                />
                <Button size={'lg'} onClick={handleGenerateWallet}>
                  {mnemonicInput ? 'Add Wallet' : 'Generate Wallet'}
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Display Secret Phrase (only after generation) */}
      {showMnemonic && mnemonicWords && wallet && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="group flex flex-col items-center gap-4 cursor-pointer rounded-lg border border-primary/10 p-8"
        >
          <div className="flex w-full justify-between items-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tighter">
              Your Recovery Phrase
            </h2>
            {countdown !== null && (
              <Badge variant="outline">Available for {countdown} seconds</Badge>
            )}
          </div>

          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertDescription className="text-yellow-500/90">
              You can copy this phrase now or you can access it later from Security Settings.
            </AlertDescription>
          </Alert>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col w-full items-center justify-center"
            onClick={() => copyToClipboard(mnemonicWords.join(' '))}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="grid grid-cols-2 gap-2 justify-center w-full items-center mx-auto my-8"
            >
              {mnemonicWords.map((word, index) => (
                <p
                  key={index}
                  className="md:text-lg bg-foreground/5 hover:bg-foreground/10 transition-all duration-300 rounded-lg p-4"
                >
                  {word}
                </p>
              ))}
            </motion.div>
            <div className="text-sm md:text-base text-primary/50 flex w-full gap-2 items-center group-hover:text-primary/80 transition-all duration-300">
              <Copy className="size-4" /> Click Anywhere To Copy
            </div>
          </motion.div>

          <div className="flex flex-col gap-2 w-full mt-4">
            <Button variant="outline" asChild>
              <Link href="/settings/security">
                <Shield className="mr-2 h-4 w-4" />
                Backup Later in Security Settings
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default WalletGenerator
