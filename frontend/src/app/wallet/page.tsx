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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto space-y-4"
      >
        {walletSolana && (
          <MotionCard
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
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
                    onClick={() =>
                      window.open(
                        `https://explorer.solana.com/address/${walletSolana.publicKey}`,
                        '_blank'
                      )
                    }
                    className="w-full sm:w-auto font-medium py-2 px-4 rounded-lg"
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
    </motion.div>
  )
}
