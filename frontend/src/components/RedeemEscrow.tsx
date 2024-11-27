import React, { useState } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { Connection } from '@solana/web3.js'
import { redeemEscrow } from '@/utils/solanaUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { tokenList } from '@/utils/tokens'

export const RedeemEscrow = () => {
  const { walletSolana } = useWallet()
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const connection = new Connection('https://api.devnet.solana.com')

  const handleRedeem = async (isSol: boolean) => {
    if (!walletSolana) {
      toast.error('Wallet not connected')
      return
    }

    setLoading(true)
    try {
      const signature = await redeemEscrow({
        connection,
        wallet: walletSolana,
        secret,
        isSol,
        token: isSol ? tokenList[0] : tokenList[1]
      })

      toast.success(
        `Redeem successful! Signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`
      )
    } catch (error) {
      console.error('Failed to redeem:', error)
      toast.error(`Failed to redeem: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Redeem Escrow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="secret">Secret Phrase</Label>
          <Input
            id="secret"
            type="text"
            placeholder="Enter the secret phrase"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="default"
            onClick={() => handleRedeem(true)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Redeem SOL'
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleRedeem(false)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Redeem Token'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
