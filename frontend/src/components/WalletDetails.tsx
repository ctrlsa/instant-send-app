'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Wallet } from '@/utils/wallet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import instance from '@/utils/axios'

interface WalletDetailsProps {
  wallet: Wallet | null
  onWalletDelete: () => void
  user: any
}

export default function WalletDetails({ wallet, onWalletDelete, user }: WalletDetailsProps) {
  const [visiblePrivateKey, setVisiblePrivateKey] = useState(false)
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [copiedPrivate, setCopiedPrivate] = useState(false)

  if (!wallet) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No wallet found for Solana</p>
        </CardContent>
      </Card>
    )
  }

  const handleDeleteWallet = async () => {
    try {
      onWalletDelete()
      await instance.delete(`/wallet/deleteSolanaWallet/${user.id}`)

      toast.success('Solana Wallet deleted successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Error deleting Solana Wallet')
    }
  }

  const copyToClipboard = (content: string, isPublic: boolean) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
    if (isPublic) {
      setCopiedPublic(true)
      setTimeout(() => setCopiedPublic(false), 2000)
    } else {
      setCopiedPrivate(true)
      setTimeout(() => setCopiedPrivate(false), 2000)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Wallet Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h3 className="text-lg font-semibold tracking-tight">Public Key</h3>
            <div className="relative group ">
              <p
                className="text-sm h-10 text-muted-foreground font-medium break-all p-2 pr-16 bg-muted rounded-md transition-colors duration-300 group-hover:bg-muted/80"
                onClick={() => copyToClipboard(wallet.publicKey, true)}
              >
                {wallet.publicKey?.slice(0, 16)}...
              </p>
              <Button
                variant="ghost"
                size="icon"
                className=" absolute top-1 right-1 transition-opacity duration-300"
                onClick={() => copyToClipboard(wallet.publicKey, true)}
              >
                {copiedPublic ? <Check className="h-4 w-4 " /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-2"
          >
            <h3 className="text-lg font-semibold tracking-tight">Private Key</h3>
            <div className="relative group">
              <p
                className="text-sm text-muted-foreground h-10 font-medium break-all p-2 pr-20 bg-muted rounded-md transition-colors duration-300 group-hover:bg-muted/80"
                onClick={() => copyToClipboard(wallet.privateKey, false)}
              >
                {visiblePrivateKey ? wallet.privateKey?.slice(0, 20) + '...' : '•'.repeat(20)}
              </p>
              <div className="absolute top-1 right-1 space-x-1 transition-opacity duration-300">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(wallet.privateKey, false)}
                >
                  {copiedPrivate ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVisiblePrivateKey(!visiblePrivateKey)}
                >
                  {visiblePrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </motion.section>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 flex justify-center"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Wallet</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this wallet?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your wallet and keys
                  from local storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteWallet}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </CardContent>
    </Card>
  )
}
