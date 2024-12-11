'use client'
import { useWallet } from '@/contexts/WalletContext'
import { motion } from 'framer-motion'
import TokenBalances from '@/components/TokenBalances'
import { useEffect, useMemo, useState } from 'react'
import { Wallet as WalletIcon } from 'lucide-react'
import { useInitData } from '@telegram-apps/sdk-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { contactsApi } from '@/services/api'
import { Contact } from '@/types'
import { EscrowOperations } from '@/components/EscrowOperations'

const SendPage = () => {
  const initData = useInitData()
  const [contacts, setContacts] = useState<Contact[]>([])
  const { walletSolana } = useWallet()

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  const getContacts = async () => {
    if (currentUser?.id) {
      const contacts = await contactsApi.getContacts(currentUser.id, initData)
      setContacts(contacts)
    }
  }

  useEffect(() => {
    if (currentUser) {
      getContacts()
    }
  }, [currentUser])

  return (
    <>
      {walletSolana ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 flex flex-col justify-end items-center h-[70vh]"
        >
          <TokenBalances contacts={contacts} defaultToken="SOL" />
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex justify-between items-center py-4 min-h-screen">
            <div className="flex items-center space-x-2">
              <WalletIcon className="h-5 w-5 text-primary" />
              <span className="font-medium">Manage Wallet</span>
            </div>
            <Link href="/wallet">
              <Button variant="outline">{walletSolana ? 'View Details' : 'Create Wallet'}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      {/* <EscrowOperations /> */}
    </>
  )
}
export default SendPage
