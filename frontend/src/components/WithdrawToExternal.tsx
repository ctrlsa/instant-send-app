'use client'

import React, { useState, useEffect } from 'react'
import { Connection } from '@solana/web3.js'
import { toast } from 'sonner'
import { LogOut, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { withdrawToExternalWallet, fetchTokenBalances, TokenWithPrice } from '@/utils/solanaUtils'
import { Wallet } from '@/utils/wallet'
import { tokenList } from '@/utils/tokens'
import { cn } from '@/lib/utils'

interface WithdrawToExternalProps {
  wallet: Wallet
}

export default function WithdrawToExternal({ wallet }: WithdrawToExternalProps) {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [tokens, setTokens] = useState<TokenWithPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<TokenWithPrice | null>(null)

  useEffect(() => {
    const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
    setConnection(conn)
  }, [])

  useEffect(() => {
    if (connection && wallet && isOpen) {
      updateTokenBalances()
    }
  }, [connection, wallet, isOpen])

  const updateTokenBalances = async () => {
    if (!wallet || !connection) return
    try {
      setLoading(true)
      const balances = await fetchTokenBalances(connection, wallet.publicKey, tokenList)
      setTokens(balances)
    } catch (error) {
      console.error('Error fetching token balances:', error)
      toast.error('Failed to fetch token balances')
    } finally {
      setLoading(false)
    }
  }

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

  const handleWithdraw = async () => {
    if (!wallet || !amount || !recipientAddress || !connection || !selectedToken) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setIsWithdrawing(true)
      const signature = await withdrawToExternalWallet(
        connection,
        wallet,
        selectedToken,
        amount,
        recipientAddress
      )
      toast.success('Withdrawal successful!', {
        description: `Transaction signature: ${signature.slice(0, 8)}...`
      })
      setIsOpen(false)
      setAmount('')
      setRecipientAddress('')
      setSelectedToken(null)
    } catch (error) {
      toast.error('Withdrawal failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="text-xs">
          Withdraw &nbsp;
          <LogOut className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
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
                  <h3 className="text-lg font-semibold">Withdraw {selectedToken.symbol}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedToken(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter Solana address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({selectedToken.symbol})</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.000000001"
                      min="0"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || !amount || !recipientAddress}
                  >
                    {isWithdrawing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    {isWithdrawing ? 'Processing...' : 'Withdraw'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
