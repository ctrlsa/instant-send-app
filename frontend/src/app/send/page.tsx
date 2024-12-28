'use client'

import { useWallet } from '@/contexts/WalletContext'
import { motion } from 'framer-motion'
import TokenBalances from '@/components/TokenBalances'
import { useEffect, useMemo } from 'react'
import { useInitData } from '@telegram-apps/sdk-react'
import { Contact } from '@/types'
import { contactsApi } from '@/services/api'
import { generateWalletFromMnemonic, createMnemonic } from '@/utils/wallet'

const SendPage = () => {
  const initData = useInitData()
  const { walletSolana, setWalletSolana } = useWallet()

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  // Auto-generate wallet if it doesn't exist
  useEffect(() => {
    if (!walletSolana && currentUser) {
      const mnemonic = createMnemonic()
      const newWallet = generateWalletFromMnemonic('501', mnemonic, 0)
      if (newWallet) {
        setWalletSolana(newWallet)
      }
    }
  }, [walletSolana, currentUser, setWalletSolana])

  // Fetch contacts
  useEffect(() => {
    const getContacts = async () => {
      if (currentUser?.id) {
        const contacts = await contactsApi.getContacts(currentUser.id, initData)
        return contacts
      }
      return []
    }

    if (currentUser) {
      getContacts()
    }
  }, [currentUser, initData])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col justify-center p-4"
    >
      {walletSolana && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 w-full flex flex-col justify-center items-center flex-grow"
        >
          <TokenBalances contacts={[]} defaultToken="SOL" />
        </motion.div>
      )}
    </motion.div>
  )
}

export default SendPage
