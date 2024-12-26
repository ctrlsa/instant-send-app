'use client'

import { useWallet } from '@/contexts/WalletContext'
import { motion } from 'framer-motion'
import TokenBalances from '@/components/TokenBalances'
import { useEffect, useMemo, useState } from 'react'
import { WalletIcon } from 'lucide-react'
import { useInitData } from '@telegram-apps/sdk-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { contactsApi } from '@/services/api'
import { Contact } from '@/types'
import { Wallet } from '@/utils/wallet'
import WalletGenerator from '@/components/WalletGenerator'

const SendPage = () => {
  const initData = useInitData()
  const [contacts, setContacts] = useState<Contact[]>([])
  const { walletSolana, setWalletSolana } = useWallet()

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col justify-center p-4"
    >
      {walletSolana ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 w-full flex flex-col justify-center items-center flex-grow"
        >
          <TokenBalances contacts={contacts} defaultToken="SOL" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className=" border rounded-xl p-4"
        >
          <WalletGenerator
            user={currentUser}
            wallet={walletSolana}
            onWalletCreated={(wallet: Wallet) => setWalletSolana(wallet)}
          />
        </motion.div>
      )}
    </motion.div>
  )
}

export default SendPage
