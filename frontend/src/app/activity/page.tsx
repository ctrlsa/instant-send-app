'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@/contexts/WalletContext'
import { Connection, PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2
} from 'lucide-react'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { tokenList } from '@/utils/tokens'
import { Button } from '@/components/ui/button'
import { redeemEscrow } from '@/utils/solanaUtils'

type SimpleTransaction = {
  signature?: string
  date?: string
  amount?: number
  type?: 'sent' | 'received'
  currency?: string
}

export default function ActivityPage() {
  const { walletSolana } = useWallet()
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [transactions, setTransactions] = useState<SimpleTransaction[]>([])
  const connection = new Connection('https://api.devnet.solana.com')

  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (walletSolana && walletSolana.publicKey) {
          setLoading(true)
          const connection = new Connection(
            'https://solana-devnet.g.alchemy.com/v2/vBKTr4oFNIbzw5mEM818uNLW4BIlkbNp'
          )
          const pubKey = new PublicKey(walletSolana.publicKey)

          // Fetch SOL transactions
          const signatures = await connection.getSignaturesForAddress(pubKey)
          const solTransactions = await Promise.all(
            signatures.map(async (sig) => {
              const tx = await connection.getTransaction(sig.signature, { commitment: 'finalized' })
              const date = new Date((sig.blockTime || 0) * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })

              if (!tx) return null

              // For SOL transactions, find if we're the sender or receiver
              const accountKeys = tx.transaction.message.accountKeys
              const ourPubKey = walletSolana.publicKey
              const ourAccountIndex = accountKeys.findIndex(
                (account) => account.toBase58() === ourPubKey
              )

              if (ourAccountIndex === -1) return null

              // Calculate the net SOL change for our account
              const preBalance = tx.meta?.preBalances?.[ourAccountIndex] ?? 0
              const postBalance = tx.meta?.postBalances?.[ourAccountIndex] ?? 0
              let amount = (postBalance - preBalance) / 1e9 // Convert lamports to SOL

              // If we're the fee payer (index 0), subtract the fee
              if (ourAccountIndex === 0) {
                amount -= (tx.meta?.fee ?? 0) / 1e9
              }

              // Skip transactions with zero amount
              if (amount === 0) return null

              const type = amount > 0 ? 'received' : 'sent'

              return {
                signature: sig.signature,
                date,
                blockTime: sig.blockTime || 0,
                amount: Math.abs(amount).toFixed(4),
                type,
                currency: 'SOL'
              }
            })
          )

          // Filter out null values from the transactions
          const filteredSolTransactions = solTransactions.filter((tx) => tx !== null)

          // Fetch USDC transactions
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
            programId: TOKEN_PROGRAM_ID
          })
          const usdcTransactions = await Promise.all(
            tokenAccounts.value.map(async (accountInfo) => {
              const account = accountInfo.account.data.parsed.info
              if (account.mint === tokenList[1].mintAddress) {
                const signatures = await connection.getSignaturesForAddress(
                  new PublicKey(accountInfo.pubkey)
                )
                return Promise.all(
                  signatures.map(async (sig) => {
                    const tx = await connection.getTransaction(sig.signature, {
                      commitment: 'finalized'
                    })
                    const date = new Date((sig.blockTime || 0) * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })

                    if (!tx?.meta?.preTokenBalances || !tx?.meta?.postTokenBalances) return null

                    // Check all token balances to find our transactions
                    const ourPreBalance =
                      tx.meta.preTokenBalances.find(
                        (balance) => balance.owner === walletSolana.publicKey
                      )?.uiTokenAmount.uiAmount ?? 0

                    const ourPostBalance =
                      tx.meta.postTokenBalances.find(
                        (balance) => balance.owner === walletSolana.publicKey
                      )?.uiTokenAmount.uiAmount ?? 0

                    // Calculate the change in our balance
                    const amount = ourPostBalance - ourPreBalance

                    // Skip transactions with zero amount
                    if (amount === 0) return null

                    const type = amount > 0 ? 'received' : 'sent'

                    return {
                      signature: sig.signature,
                      date,
                      blockTime: sig.blockTime || 0,
                      amount: Math.abs(amount).toFixed(2),
                      type,
                      currency: 'USDC'
                    }
                  })
                )
              }
              return []
            })
          )

          // Flatten the USDC transactions array and remove nulls
          const flattenedUsdcTransactions = usdcTransactions
            .flat()
            .filter((tx): tx is NonNullable<typeof tx> => tx !== null)

          // Get signatures of USDC transactions to filter out their SOL gas transactions
          const usdcSignatures = new Set(flattenedUsdcTransactions.map((tx) => tx.signature))

          // Filter SOL transactions, removing those that are just gas fees for USDC transfers
          const filteredSolTransactionsWithoutGas = filteredSolTransactions.filter(
            (tx) => !usdcSignatures.has(tx.signature)
          )

          // Combine SOL and USDC transactions and sort by date and block time
          const combinedTransactions = [
            ...filteredSolTransactionsWithoutGas,
            ...flattenedUsdcTransactions
          ]
            .filter((tx) => tx !== null)
            .sort((a, b) => {
              // First compare by block time (most recent first)
              return b.blockTime - a.blockTime
            })

          setTransactions(
            combinedTransactions.map((tx) => ({
              signature: tx.signature,
              date: tx.date,
              amount: Number(tx.amount),
              type: tx.type as 'sent' | 'received',
              currency: tx.currency
            }))
          )
        }
      } catch (error) {
        toast.error('Failed to fetch transactions')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [walletSolana])

  const pageCount = Math.ceil(transactions.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }
  const handleRedeem = async (secret: string, sender: string, token: string, signature: string) => {
    console.log(secret, sender, token)
    if (!walletSolana) {
      toast.success('Create a wallet to receive tokens')
      return
    }
    if (walletSolana) {
      const balance = await connection.getBalance(new PublicKey(walletSolana.publicKey))
      if (balance === 0) {
        toast.error('Insufficient balance. Please, top up')
        return
      }
    }
    try {
      setIsRedeeming(true)
      await redeemEscrow(
        connection,
        walletSolana,
        token === 'SOL' ? tokenList[0].mintAddress : tokenList[1].mintAddress,
        sender,
        secret,
        token === 'SOL'
      )
      toast.success('Received tokens successfully! Check your wallet.')
      localStorage.removeItem(signature)
    } catch (error) {
      console.error(error)
      toast.error('Invalid link or network error')
    } finally {
      setIsRedeeming(false)
    }
  }
  const handleReceiveBack = (signature: string) => {
    const storedLink = localStorage.getItem(signature)
    if (storedLink) {
      const urlObj = new URL(storedLink)
      const [secret, sender, token] = urlObj.searchParams.get('startapp')?.split('__') || []
      // Logic to handle receiving back the transaction
      if (secret && sender && token) {
        handleRedeem(secret, sender, token, signature)
      }

      console.log(`Receive back for transaction: ${signature}`)
      // You can add more logic here to process the receive back action
    } else {
      toast.error('No stored link found for this transaction')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-center min-h-screen p-3 md:p-4 max-w-4xl mx-auto"
    >
      {loading ? (
        <div className="flex justify-center items-center">
          <Loader2 className="mr-2 h-166 w-16 animate-spin text-primary" />
        </div>
      ) : currentTransactions.length > 0 ? (
        <>
          <div className="space-y-4">
            {currentTransactions.map((txn) => (
              <motion.div
                key={txn.signature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-card to-card/80 text-card-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/10"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-2 rounded-full ${
                      txn.type === 'received'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                        : 'bg-gradient-to-br from-red-400 to-rose-600'
                    }`}
                  >
                    {txn.type === 'received' ? (
                      <ArrowDownIcon className="w-6 h-6 text-white" />
                    ) : (
                      <ArrowUpIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-primary mb-1">
                      {txn.type === 'received' ? 'Received' : 'Sent'}
                    </div>
                    <div className="text-xs text-muted-foreground">{txn.date}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={`font-bold mb-1 ${
                      txn.type === 'received'
                        ? 'text-green-500 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    {txn.type === 'received' ? '+' : '-'}
                    {txn.amount} {txn.currency}
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${txn.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:text-primary/80 transition-colors duration-200 flex items-center"
                  >
                    Details
                    <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </a>
                </div>
                {txn.type === 'sent' && localStorage.getItem(txn.signature ?? '') && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isRedeeming}
                    onClick={() => handleReceiveBack(txn.signature ?? '')}
                    className="ml-2"
                  >
                    {isRedeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refund'}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex justify-center items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground mt-8 p-6 bg-card rounded-xl border border-primary/10">
          <p className="text-lg font-semibold mb-2">No transactions yet</p>
        </div>
      )}
    </motion.div>
  )
}
