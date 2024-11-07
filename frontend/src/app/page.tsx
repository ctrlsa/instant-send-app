'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInitData } from '@telegram-apps/sdk-react'
import { User, Wallet as WalletIcon } from 'lucide-react'
import instance from '@/utils/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import Contacts from '@/components/Contacts'
import TokenBalances from '@/components/TokenBalances'
import { useWallet } from '@/contexts/WalletContext'

export default function Home() {
  const initData = useInitData()
  const [contacts, setContacts] = useState([])
  const { walletSolana } = useWallet()
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  const getContacts = async () => {
    try {
      if (currentUser?.id) {
        const res = await instance.get(`contacts/getContacts/${currentUser.id}`, {
          params: {
            initData: JSON.stringify(initData)
          }
        })
        setContacts(res.data)
        setIsFetchingContacts(false)
      }
    } catch (e) {
      console.error(e)
      setIsFetchingContacts(false)
    }
  }
  useEffect(() => {
    if (currentUser) {
      getContacts()
    }
  }, [])
  useEffect(() => {
    if (currentUser) {
      getContacts()
    }
  }, [currentUser])

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
            <Contacts
              user={currentUser}
              contacts={contacts}
              handleRefresh={getContacts}
              isFetching={isFetchingContacts}
            />
          </CardContent>
        </Card>

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
