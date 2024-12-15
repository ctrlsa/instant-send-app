'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import WalletGenerator from '@/components/WalletGenerator'
import WalletDetails from '@/components/WalletDetails'
import { useWallet } from '@/contexts/WalletContext'
import { useInitData } from '@telegram-apps/sdk-react'
import { Wallet } from '@/utils/wallet'

const MotionCard = motion(Card)

export default function WalletManagement() {
  const initData = useInitData()
  const { walletSolana, setWalletSolana } = useWallet()

  const currentUser = React.useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3 md:p-6 h-[70vh]"
    >
      {!walletSolana ? (
        <MotionCard
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden shadow-lg border flex-grow"
        >
          <CardContent className="p-6">
            <div className="grid gap-8 md:grid-cols-2">
              <WalletGenerator
                user={currentUser}
                wallet={walletSolana}
                onWalletCreated={(wallet: Wallet) => setWalletSolana(wallet)}
              />
            </div>
          </CardContent>
        </MotionCard>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pb-4"
        >
          <WalletDetails
            user={currentUser}
            wallet={walletSolana}
            onWalletDelete={() => setWalletSolana(null)}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
