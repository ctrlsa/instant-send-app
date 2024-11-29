'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInitData, useViewport } from '@telegram-apps/sdk-react'
import { User, Wallet as WalletIcon, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

import Contacts from '@/components/Contacts'
import TokenBalances from '@/components/TokenBalances'
import { useWallet } from '@/contexts/WalletContext'
import { contactsApi } from '@/services/api'
import { Contact } from '@/types'
import { RedeemEscrow } from '@/components/RedeemEscrow'

export default function Home() {
  const initData = useInitData()
  const viewport = useViewport()

  const [contacts, setContacts] = useState<Contact[]>([])
  const { walletSolana } = useWallet()
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])
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
            toast.success('Contacts updated successfully')
          }
        }
      } catch (e) {
        console.error(e)
        toast.error('Failed to fetch contacts')
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
  useEffect(() => {
    if (!initData) return
    // const urlParams = new URLSearchParams(initData)
    // const startParam = urlParams.get('start')
    console.log(initData.startParam)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* User Card */}
        <Card className="cursor-pointer">
          <CardContent className="flex flex-col items-center space-y-0 pb-2 mt-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold"
            >
              {currentUser?.name}
            </motion.div>
            <p className="text-xs text-muted-foreground">@{currentUser?.username}</p>
          </CardContent>
        </Card>

        {/* Wallet Management Link */}
        <Card>
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <WalletIcon className="h-5 w-5 text-primary" />
              <span className="font-medium">Manage Wallet</span>
            </div>
            <Link href="/wallet">
              <Button variant="outline">{walletSolana ? 'View Details' : 'Create Wallet'}</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardContent>
            {isFetchingContacts && !contacts.length ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4"></div>
                <Contacts
                  user={currentUser}
                  contacts={contacts}
                  handleRefresh={() => getContacts(true)}
                  isFetching={isFetchingContacts}
                  isRefreshing={isRefreshing}
                />
              </div>
            )}
          </CardContent>
        </Card>
        {/* Redeem Escrow */}
        {walletSolana && <RedeemEscrow />}
        {/* Token Balances */}
        {walletSolana && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TokenBalances contacts={contacts} />
          </motion.div>
        )}
      </main>
    </motion.div>
  )
}
