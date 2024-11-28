'use client'

import { useState, useEffect, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCcw, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { initUtils } from '@telegram-apps/sdk'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useWallet } from '@/contexts/WalletContext'
import { tokenList } from '@/utils/tokens'
import { fetchTokenBalances, sendTokens, Token, initializeEscrow } from '@/utils/solanaUtils'
import { cn } from '@/lib/utils'
import { BN } from '@coral-xyz/anchor'

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

  const [sendAmount, setSendAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [escrowSecret, setEscrowSecret] = useState<string | null>(null)
  const [escrowTx, setEscrowTx] = useState<string | null>(null)

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
    if (!selectedToken || !sendAmount || !recipient || !connection || !walletSolana) {
      toast.error('Please fill in all fields and ensure wallet is connected')
      return
    }

    setLoading(true)
    try {
      const recipientAddress = contacts.find((contact) => contact.id === recipient)?.solanaAddress
      if (recipientAddress != null) {
        await sendTokens(connection, walletSolana, selectedToken, sendAmount, recipientAddress)
        toast.success(
          `Sent ${sendAmount} ${selectedToken.symbol} to ${
            contacts.find((contact) => contact.id === recipient)?.name || 'Recipient'
          }`
        )
        setSelectedToken(null)
        setSendAmount('')
        setRecipient('')
        await updateTokenBalances()
      } else {
        const secret = Math.random().toString(36).substring(2, 15)
        setEscrowSecret(secret)

        const expirationTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60
        console.log(selectedToken.mintAddress, selectedToken.symbol)
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
        toast.success('Escrow account created successfully')
      }
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof Error) {
        if (error.message.includes('0x1')) {
          toast.error(`Insufficient funds for transfer and fees. Please check your balance.`)
        } else {
          toast.error(`Transaction failed: ${error.message}`)
        }
      } else {
        toast.error('An unknown error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getRedeemLink = () => {
    if (!escrowSecret || !escrowTx) return ''
    return `https://t.me/InstantSendTestBot/InstantSendLocalTest/redeem?tx=${escrowTx}&secret=${escrowSecret}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row justify-between items-center">
          <CardTitle>Token Balances</CardTitle>
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
              <div className="grid grid-cols-3 gap-4">
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

                  {/* Send Form */}
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
                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient</Label>
                      <Select onValueChange={setRecipient} value={recipient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSend}
                      disabled={loading || isRefreshing}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send {selectedToken.symbol}
                    </Button>
                  </div>

                  {escrowSecret && escrowTx && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-4 border rounded-lg"
                    >
                      <h4 className="font-semibold mb-2">Share this link with the recipient</h4>
                      <div className="flex gap-2">
                        <Input readOnly value={getRedeemLink()} />
                        <Button
                          onClick={() => {
                            // navigator.clipboard.writeText(getRedeemLink())
                            // toast.success('Link copied to clipboard')
                            utils.shareURL(getRedeemLink())
                          }}
                        >
                          Share
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        This link will expire in 24 hours
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
