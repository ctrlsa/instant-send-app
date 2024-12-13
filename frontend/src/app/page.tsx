'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { postEvent, useInitData, useViewport } from '@telegram-apps/sdk-react'
import { Loader2, WalletIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useWallet } from '@/contexts/WalletContext'
import { contactsApi } from '@/services/api'
import { Contact } from '@/types'
import { RedeemEscrow } from '@/components/RedeemEscrow'
import { tokenList } from '@/utils/tokens'
import { redeemEscrow } from '@/utils/solanaUtils'
import { Connection, PublicKey } from '@solana/web3.js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const initData = useInitData()
  const viewport = useViewport()

  const connection = new Connection('https://api.devnet.solana.com')

  const [contacts, setContacts] = useState<Contact[]>([])
  const { walletSolana } = useWallet()
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])
  useEffect(() => {
    postEvent('web_app_setup_back_button', {
      is_visible: true
    })
    postEvent('web_app_setup_swipe_behavior', {
      allow_vertical_swipe: false
    })
  }, [])

  useEffect(() => {
    const vp = viewport
    if (!vp?.isExpanded) {
      vp?.expand()
    }
  }, [viewport])

  const getContacts = useCallback(
    async (isRefreshAction = false) => {
      try {
        isRefreshAction ? setIsRefreshing(true) : setIsFetchingContacts(true)

        if (currentUser?.id) {
          const res = await contactsApi.getContacts(currentUser.id, initData)
          setContacts(res)

          if (isRefreshAction) {
            // toast.success('Contacts updated successfully')
            console.log('Contacts updated successfully')
          }
        }
      } catch (e) {
        console.error(e)
        // toast.error('Failed to fetch contacts')
      } finally {
        setIsFetchingContacts(false)
        setIsRefreshing(false)
      }
    },
    [currentUser?.id, initData]
  )

  useEffect(() => {
    if (currentUser) {
      getContacts()
    }
  }, [currentUser, getContacts])

  const handleRedeem = async (secret: string, sender: string, token: string) => {
    console.log(secret, sender, token)
    if (!walletSolana) {
      toast.success('Create a wallet to receive tokens')
      return
    }
    if (walletSolana) {
      const balance = await connection.getBalance(new PublicKey(walletSolana.publicKey))
      // check if balance is greater than 0
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
    } catch (error) {
      console.error(error)
      toast.error('Invalid link or network error')
    } finally {
      setIsRedeeming(false)
    }
  }

  useEffect(() => {
    if (!initData) return
    if (initData?.startParam) {
      const [secret, sender, token] = initData?.startParam?.split('__')
      if (secret && sender && token) {
        handleRedeem(secret, sender, token)
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col justify-end h-[70vh]" // Adjust the pb value as needed to account for the footer
    >
      {isRedeeming && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Receiving tokens...</span>
        </div>
      )}

      <div>
        {/* Receive or Redeem Escrow */}
        <div className="mb-4">{walletSolana && <RedeemEscrow />}</div>

        {/* Wallet Management Card */}
        {!walletSolana && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-16"
          >
            <Card>
              <CardContent className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-2">
                  <WalletIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium">Manage Wallet</span>
                </div>
                <Link href="/wallet">
                  <Button variant="outline">
                    {walletSolana ? 'View Details' : 'Create Wallet'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
