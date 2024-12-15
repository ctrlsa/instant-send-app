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
import { Card, CardContent } from '@/components/ui/card'
import { walletApi } from '@/services/api'

interface WalletDetailsProps {
  wallet: Wallet | null
  onWalletDelete: () => void
  user: any
}

export default function WalletDetails({ wallet, onWalletDelete, user }: WalletDetailsProps) {
  const [state, setState] = useState({
    visiblePrivateKey: false,
    copiedPublic: false,
    copiedPrivate: false
  })

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
      await walletApi.deleteWallet(user.id)
      toast.success('Solana wallet deleted successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Error deleting Solana wallet')
    }
  }

  const copyToClipboard = async (content: string, isPublic: boolean) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard!')
      setState((prev) => ({ ...prev, [isPublic ? 'copiedPublic' : 'copiedPrivate']: true }))
      setTimeout(
        () =>
          setState((prev) => ({ ...prev, [isPublic ? 'copiedPublic' : 'copiedPrivate']: false })),
        2000
      )
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const renderKeySection = (title: string, value: string, isPublic: boolean) => (
    <div className="space-y-2">
      <h3 className="text-md font-semibold tracking-tight">{title}</h3>
      <div className="relative group">
        <p
          className="text-sm h-10 text-muted-foreground font-medium break-all p-2 pr-20 bg-muted rounded-md transition-colors duration-300 group-hover:bg-muted/80"
          onClick={() => copyToClipboard(value, isPublic)}
        >
          {isPublic
            ? `${value.slice(0, 16)}...`
            : state.visiblePrivateKey
              ? `${value.slice(0, 20)}...`
              : '•'.repeat(20)}
        </p>
        <div className="absolute top-1 right-1 space-x-1">
          <Button variant="ghost" size="icon" onClick={() => copyToClipboard(value, isPublic)}>
            {state[isPublic ? 'copiedPublic' : 'copiedPrivate'] ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          {!isPublic && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setState((prev) => ({ ...prev, visiblePrivateKey: !prev.visiblePrivateKey }))
              }
            >
              {state.visiblePrivateKey ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="grid gap-6 sm:grid-cols-2">
          {renderKeySection('Public Key', wallet.publicKey, true)}
          {renderKeySection('Private Key', wallet.privateKey, false)}
        </div>
        <div className="mt-6 flex justify-center">
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
        </div>
      </CardContent>
    </Card>
  )
}
