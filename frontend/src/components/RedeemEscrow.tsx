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
  const [inputUrl, setInputUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSol, setIsSol] = useState<boolean | null>(null)
  const connection = new Connection('https://api.devnet.solana.com')

  const parseInputUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const param = urlObj.searchParams.get('startapp')
      const [secret, sender, token] = param?.split('__') || []
      setIsSol(token === 'SOL')
      return {
        secret,
        sender
      }
    } catch (error) {
      console.error('Invalid URL:', error)
      return null
    }
  }

  const handleRedeem = async () => {
    if (!walletSolana) {
      toast.error('Wallet not connected')
      return
    }

    const params = parseInputUrl(inputUrl)
    if (!params) {
      toast.error('Invalid redemption link')
      return
    }

    setLoading(true)
    try {
      if (
        isSol === null ||
        isSol === undefined ||
        params.sender === null ||
        params.sender === undefined ||
        params.secret === null ||
        params.secret === undefined
      ) {
        console.log(isSol, params.sender, params.secret)
        toast.error('Invalid redemption link')
        return
      }
      const signature = await redeemEscrow(
        connection,
        walletSolana,
        isSol ? tokenList[0].mintAddress : tokenList[1].mintAddress,
        params.sender,
        params.secret,
        isSol
      )

      toast.success(`Redeemed ${isSol ? 'SOL' : 'USDC'} successfully! Check your wallet.`)
    } catch (error) {
      console.error('Failed to redeem:', error)
      toast.error(`Failed to redeem`)
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
          <Label htmlFor="inputUrl">Redemption Link</Label>
          <Input
            id="inputUrl"
            type="text"
            placeholder="Enter the redemption link"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            variant="default"
            onClick={() => handleRedeem()}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Redeem '
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
