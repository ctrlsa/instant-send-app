import React, { useState } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { Connection, PublicKey } from '@solana/web3.js'
import { initializeEscrow } from '@/utils/solanaUtils'
import { tokenList } from '@/utils/tokens'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { RedeemEscrow } from './RedeemEscrow'

export const EscrowOperations = () => {
  const { walletSolana } = useWallet()
  const [amount, setAmount] = useState('')
  const [secret, setSecret] = useState('')
  const [expirationTime, setExpirationTime] = useState('')
  const [loading, setLoading] = useState(false)

  const connection = new Connection('https://api.devnet.solana.com')

  const handleInitialize = async (isSol: boolean) => {
    if (!walletSolana) {
      toast.error('Wallet not connected')
      return
    }

    setLoading(true)
    try {
      const expTime = Math.floor(Date.now() / 1000) + parseInt(expirationTime) * 60

      const signature = await initializeEscrow(
        connection,
        walletSolana,
        isSol ? new PublicKey(tokenList[0].mintAddress) : new PublicKey(tokenList[1].mintAddress),
        amount,
        expTime,
        secret,
        isSol
      )

      if (signature) {
        toast.success(`Transaction successful! Signature: ${signature.signature}`)
      }
    } catch (error) {
      console.error('Failed to initialize escrow:', error)

      toast.error(
        `Failed to initialize escrow: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Escrow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="text"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secret">Secret</Label>
          <Input
            id="secret"
            type="text"
            placeholder="Enter secret phrase"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiration">Expiration (minutes)</Label>
          <Input
            id="expiration"
            type="text"
            placeholder="Enter expiration time"
            value={expirationTime}
            onChange={(e) => setExpirationTime(e.target.value)}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="default"
            onClick={() => handleInitialize(true)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Initialize SOL Escrow'
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleInitialize(false)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Initialize Token Escrow'
            )}
          </Button>
        </div>
      </CardContent>
      <RedeemEscrow />
    </Card>
  )
}
