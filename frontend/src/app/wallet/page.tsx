'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import WalletGenerator from '@/components/WalletGenerator'
import WalletDetails from '@/components/WalletDetails'
import { useWallet } from '@/contexts/WalletContext'
import { useInitData } from '@telegram-apps/sdk-react'
import { Wallet } from '@/utils/wallet'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExternalLink, ScrollText } from 'lucide-react'
import WithdrawToExternal from '@/components/WithdrawToExternal'

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
    <div className="min-h-screen p-3 md:p-6">
      {!walletSolana ? (
        <MotionCard
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden shadow-lg border"
        >
          <CardContent className="p-6">
            <div className="grid gap-8 md:grid-cols-2">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <WalletGenerator
                  user={currentUser}
                  wallet={walletSolana}
                  onWalletCreated={(wallet: Wallet) => setWalletSolana(wallet)}
                />
              </motion.div>
            </div>
          </CardContent>
        </MotionCard>
      ) : (
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="pb-4"
        >
          <WalletDetails
            user={currentUser}
            wallet={walletSolana}
            onWalletDelete={() => setWalletSolana(null)}
          />
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-4"
      >
        {walletSolana && (
          <MotionCard
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden shadow-lg border "
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link href="/transactions" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg">
                    <ScrollText className="mr-2 h-4 w-4" />
                    Transactions
                  </Button>
                </Link>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto  text-gray-200 font-medium py-2 px-4 rounded-lg "
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Explorer
                  </Button>
                  <WithdrawToExternal wallet={walletSolana} />
                </div>
              </div>
            </CardContent>
          </MotionCard>
        )}
      </motion.div>
    </div>
  )
}
