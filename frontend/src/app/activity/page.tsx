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
  Loader2,
  Lock
} from 'lucide-react'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { tokenList } from '@/utils/tokens'
import { Button } from '@/components/ui/button'
import { getStoredEscrows } from '@/utils/solanaUtils'

type SimpleTransaction = {
  signature?: string
  date?: string
  amount?: number
  type?: 'sent' | 'received' | 'escrow'
  currency?: string
  escrowSecret?: string
  escrowStatus?: 'pending' | 'claimed'
}

export default function ActivityPage() {
  const { walletSolana } = useWallet()
  const [transactions, setTransactions] = useState<SimpleTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (walletSolana && walletSolana.publicKey) {
          setLoading(true)
          const connection = new Connection('https://api.devnet.solana.com')
          const pubKey = new PublicKey(walletSolana.publicKey)

          // Get stored escrow transactions
          const storedEscrows = getStoredEscrows()
          const escrowTransactions: SimpleTransaction[] = storedEscrows.map((escrow) => ({
            signature: escrow.tx,
            date: new Date(escrow.timestamp).toLocaleDateString(),
            amount: Number(escrow.amount),
            type: 'escrow',
            currency: escrow.token,
            escrowSecret: escrow.secret,
            escrowStatus: 'pending'
          }))

          // Fetch SOL transactions
          const signatures = await connection.getSignaturesForAddress(pubKey)
          const solTransactions = await Promise.all(
            signatures.map(async (sig) => {
              const tx = await connection.getTransaction(sig.signature, { commitment: 'finalized' })
              const date = new Date((sig.blockTime || 0) * 1000).toLocaleDateString()

              // Get the index of our wallet in the accounts list
              const accountIndex =
                tx?.transaction.message.accountKeys.findIndex(
                  (account) => account.toBase58() === walletSolana.publicKey
                ) ?? -1

              // Calculate the balance change for our account
              const preBalance = tx?.meta?.preBalances?.[accountIndex] ?? 0
              const postBalance = tx?.meta?.postBalances?.[accountIndex] ?? 0
              const balanceChange = postBalance - preBalance
              const fee = accountIndex === 0 ? (tx?.meta?.fee ?? 0) : 0 // Only subtract fee if we're the fee payer

              // Calculate final amount including fee if we're the fee payer
              const amount = balanceChange + fee

              // If amount is positive, we received SOL. If negative, we sent SOL.
              const type = amount > 0 ? 'received' : 'sent'

              return {
                signature: sig.signature,
                date,
                amount: (Math.abs(amount) / 1e9).toFixed(4), // Convert lamports to SOL
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
                    const date = new Date((sig.blockTime || 0) * 1000).toLocaleDateString()

                    // Find our token account in postTokenBalances
                    const ourTokenAccountIndex =
                      tx?.meta?.postTokenBalances?.findIndex(
                        (balance) => balance.owner === walletSolana.publicKey
                      ) ?? -1

                    if (ourTokenAccountIndex === -1) return null

                    const preBalance =
                      tx?.meta?.preTokenBalances?.[ourTokenAccountIndex]?.uiTokenAmount?.uiAmount ??
                      0
                    const postBalance =
                      tx?.meta?.postTokenBalances?.[ourTokenAccountIndex]?.uiTokenAmount
                        ?.uiAmount ?? 0
                    const amount = postBalance - preBalance

                    if (Math.abs(amount) === 0) return null

                    const type = amount > 0 ? 'received' : 'sent'

                    return {
                      signature: sig.signature,
                      date,
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

          // Flatten the USDC transactions array
          const flattenedUsdcTransactions = usdcTransactions.flat()

          // Combine all transactions
          setTransactions(
            [...escrowTransactions, ...filteredSolTransactions, ...flattenedUsdcTransactions]
              .filter((tx): tx is SimpleTransaction => {
                if (!tx) return false
                return (
                  typeof tx.signature === 'string' &&
                  typeof tx.date === 'string' &&
                  typeof tx.amount === 'number' &&
                  typeof tx.type === 'string' &&
                  typeof tx.currency === 'string'
                )
              })
              .sort((a, b) => {
                const dateA = new Date(a.date).getTime()
                const dateB = new Date(b.date).getTime()
                return dateB - dateA
              })
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'received':
        return <ArrowDownIcon className="w-6 h-6 text-white" />
      case 'sent':
        return <ArrowUpIcon className="w-6 h-6 text-white" />
      case 'escrow':
        return <Lock className="w-6 h-6 text-white" />
      default:
        return <ArrowUpIcon className="w-6 h-6 text-white" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'received':
        return 'from-green-400 to-emerald-600'
      case 'sent':
        return 'from-red-400 to-rose-600'
      case 'escrow':
        return 'from-blue-400 to-blue-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const getTransactionLabel = (txn: SimpleTransaction) => {
    switch (txn.type) {
      case 'received':
        return 'Received payment'
      case 'sent':
        return 'Sent payment'
      case 'escrow':
        return 'Escrow transfer'
      default:
        return 'Transaction'
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
                    className={`p-2 rounded-full bg-gradient-to-br ${getTransactionColor(txn.type!)}`}
                  >
                    {getTransactionIcon(txn.type!)}
                  </div>
                  <div>
                    <div className="font-bold text-primary mb-1">{getTransactionLabel(txn)}</div>
                    <div className="text-sm text-muted-foreground">{txn.date}</div>
                    {txn.type === 'escrow' && (
                      <div className="text-xs text-blue-500">Status: {txn.escrowStatus}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={`font-bold mb-1 ${
                      txn.type === 'received'
                        ? 'text-green-500 dark:text-green-400'
                        : txn.type === 'escrow'
                          ? 'text-blue-500 dark:text-blue-400'
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
                    View transaction
                    <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </a>
                </div>
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
