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

type SimpleTransaction = {
  signature?: string
  date?: string
  amount?: number
  type?: 'sent' | 'received'
  currency?: string
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
          //   const connection = new Connection('https://rpc.ankr.com/solana_devnet')
          const connection = new Connection('https://api.devnet.solana.com')
          const pubKey = new PublicKey(walletSolana.publicKey)

          // Fetch SOL transactions
          const signatures = await connection.getSignaturesForAddress(pubKey)
          const solTransactions = await Promise.all(
            signatures.map(async (sig) => {
              const tx = await connection.getTransaction(sig.signature, { commitment: 'finalized' })
              const date = new Date((sig.blockTime || 0) * 1000).toLocaleDateString()
              const preBalance = tx?.meta?.preBalances?.[0] ?? 0
              const postBalance = tx?.meta?.postBalances?.[0] ?? 0
              const fee = tx?.meta?.fee ?? 0
              const amount = postBalance - preBalance // Exclude fee from the amount

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
                // Replace with actual USDC mint address
                const signatures = await connection.getSignaturesForAddress(
                  new PublicKey(accountInfo.pubkey)
                )
                return Promise.all(
                  signatures.map(async (sig) => {
                    const tx = await connection.getTransaction(sig.signature, {
                      commitment: 'finalized'
                    })
                    const date = new Date((sig.blockTime || 0) * 1000).toLocaleDateString()
                    console.log(tx)
                    const amount = tx?.meta?.postTokenBalances?.[1]?.uiTokenAmount?.uiAmount ?? 0
                    if (Math.abs(amount).toFixed(2) === '0.00') {
                      return null
                    }
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
          // Combine SOL and USDC transactions
          setTransactions(
            [...filteredSolTransactions, ...flattenedUsdcTransactions]
              .filter(
                (
                  tx
                ): tx is {
                  signature: string
                  date: string
                  amount: string
                  type: string
                  currency: string
                } => {
                  if (!tx) return false
                  return (
                    typeof tx.signature === 'string' &&
                    typeof tx.date === 'string' &&
                    typeof tx.amount === 'string' &&
                    typeof tx.type === 'string' &&
                    typeof tx.currency === 'string'
                  )
                }
              )
              .map((tx) => ({
                signature: tx?.signature,
                date: tx?.date,
                amount: Number(tx?.amount),
                type: tx?.type as 'sent' | 'received',
                currency: tx?.currency
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-end p-3 md:p-4 max-w-4xl mx-auto"
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
                      {txn.type === 'received' ? 'Received payment' : 'Sent payment'}
                    </div>
                    <div className="text-sm text-muted-foreground">{txn.date}</div>
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
