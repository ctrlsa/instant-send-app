'use client'

import { useState, useEffect, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCcw, Send, X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { initUtils } from '@telegram-apps/sdk'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { toast } from 'sonner'
import { useWallet } from '@/contexts/WalletContext'
import { tokenList } from '@/utils/tokens'
import { fetchTokenBalances, Token, initializeEscrow, fetchTokenPrices } from '@/utils/solanaUtils'
import { cn } from '@/lib/utils'
import { BN } from '@coral-xyz/anchor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Contact = {
  id: string
  name: string
  solanaAddress?: string
}

type TokenBalancesProps = {
  contacts: Contact[]
  defaultToken?: string
}

type TokenWithPrice = Token & {
  usdPrice?: number
}

export default function TokenBalances({ contacts, defaultToken }: TokenBalancesProps) {
  const { walletSolana } = useWallet()
  const [connection, setConnection] = useState<Connection | null>(null)
  const [tokens, setTokens] = useState<TokenWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenWithPrice | null>(
    defaultToken ? (tokenList.find((token) => token.symbol === defaultToken) ?? null) : null
  )
  const utils = initUtils()

  const [sendAmount, setSendAmount] = useState<string>('0.05')
  const [priceLoaded, setPriceLoaded] = useState(false)

  useEffect(() => {
    const initializeDefaultAmount = async () => {
      try {
        if (selectedToken?.symbol === 'USDC') {
          setSendAmount('1.00') // Set to 1 USDC by default
          return
        }

        const prices = await fetchTokenPrices(['SOL'])
        const solPrice = prices['SOL'] // Fallback to 20 if price fetch fails
        setSendAmount((1 / solPrice).toFixed(4)) // Convert $1 to SOL amount
      } catch (error) {
        console.error('Error fetching SOL price:', error)
        setSendAmount((1 / 20).toFixed(4)) // Fallback to default $20 price
      } finally {
        setPriceLoaded(true)
      }
    }

    initializeDefaultAmount()
  }, [priceLoaded, selectedToken])

  const [escrowSecret, setEscrowSecret] = useState<string | null>(null)
  const [escrowTx, setEscrowTx] = useState<string | null>(null)
  const [escrowToken, setEscrowToken] = useState<TokenWithPrice | null>(null)
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const updateTokenBalances = useCallback(
    async (isRefreshAction = false) => {
      if (!walletSolana || !connection) return

      try {
        isRefreshAction ? setIsRefreshing(true) : setLoading(true)
        const balances = await fetchTokenBalances(connection, walletSolana.publicKey, tokenList)
        setTokens(balances)

        if (isRefreshAction) {
          toast.success('Token balances updated')
        }
      } catch (error) {
        console.error('Error fetching token balances:', error)
        toast.error('Failed to fetch token balances')
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    },
    [walletSolana, connection]
  )

  useEffect(() => {
    const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
    setConnection(conn)
  }, [])

  useEffect(() => {
    if (connection) {
      updateTokenBalances()
    }
  }, [connection, updateTokenBalances])

  const formatBalance = (balance: number) => {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleSend = async () => {
    if (!selectedToken || !sendAmount || !connection || !walletSolana) {
      toast.error('Please fill in all fields and ensure wallet is connected')
      return
    }

    setIsCreatingEscrow(true)
    try {
      const secret = Math.random().toString(36).substring(2, 15)
      setEscrowSecret(secret)
      setEscrowToken(selectedToken)

      const expirationTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60
      const tx = await initializeEscrow(
        connection,
        walletSolana,
        selectedToken.symbol === 'SOL' ? null : new PublicKey(selectedToken.mintAddress),
        parseFloat(sendAmount),
        new BN(expirationTime),
        secret,
        selectedToken.symbol === 'SOL'
      )

      setEscrowTx(tx)
      toast.success('Transfer created successfully, share link with recipient')
      setShowShareModal(true)

      await updateTokenBalances()
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof Error) {
        if (error.message.includes('0x1')) {
          toast.error('Insufficient funds, please top up your account')
        } else {
          toast.error(`Transaction failed: ${error.message}`)
        }
      } else {
        toast.error('An unknown error occurred. Please try again.')
      }
    } finally {
      setIsCreatingEscrow(false)
      setLoading(false)
    }
  }

  const getRedeemLink = () => {
    if (!escrowSecret || !escrowTx || !escrowToken) return ''
    if (process.env.NODE_ENV === 'development') {
      return `https://t.me/InstantSendTestBot/InstantSendLocalTest?startapp=${escrowSecret}__${walletSolana?.publicKey}__${escrowToken.symbol}`
    } else {
      return `https://t.me/InstantSendAppBot/InstantSendApp?startapp=${escrowSecret}__${walletSolana?.publicKey}__${escrowToken.symbol}`
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-row justify-between items-center">
          <CardTitle className="font-bold">Send</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateTokenBalances(true)}
            disabled={loading || isRefreshing}
          >
            <RefreshCcw className={cn('h-4 w-4', (loading || isRefreshing) && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !tokens.length ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tokens.map((token) => (
                  <motion.div
                    key={token.symbol}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedToken(token)}
                  >
                    <Card
                      className={cn(
                        'transition-all duration-200',
                        selectedToken?.symbol === token.symbol && 'border-2 border-primary'
                      )}
                    >
                      <CardContent className="flex flex-col items-center justify-center p-4">
                        <span className="text-2xl mb-2">{token.icon}</span>
                        <h3 className="font-bold">{token.symbol}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatBalance(token.balance ? token.balance : 0)}
                        </p>
                        {token.usdPrice && token.balance ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatUSD(token.balance * token.usdPrice)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">{formatUSD(0)}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No tokens found</div>
            )}

            <AnimatePresence>
              {selectedToken && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Send {selectedToken.symbol}</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedToken(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    <Button
                      className="w-full py-4"
                      onClick={handleSend}
                      disabled={isCreatingEscrow}
                    >
                      {isCreatingEscrow ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Send via Telegram
                        </>
                      )}
                    </Button>
                    {escrowSecret && escrowTx && (
                      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Share Escrow Link</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Redeem Link</Label>
                              <div className="p-3 bg-muted rounded-md break-all text-sm font-mono">
                                {getRedeemLink()}
                              </div>
                            </div>

                            <Button
                              className="w-full"
                              variant="secondary"
                              onClick={() => {
                                const link = getRedeemLink()
                                if (link) {
                                  utils.shareURL(link)
                                }
                              }}
                            >
                              <Send className="h-5 w-5 mr-2" />
                              Share via Telegram
                            </Button>
                            <p className="text-sm text-muted-foreground text-center">
                              Link will expire in 24 hours
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
