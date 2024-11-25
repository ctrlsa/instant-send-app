'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WalletGenerator from '@/components/WalletGenerator'
import WalletDetails from '@/components/WalletDetails'
import { useWallet } from '@/contexts/WalletContext'
import { useInitData } from '@telegram-apps/sdk-react'
import { Wallet } from '@/utils/wallet'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExternalLink, ScrollText, WalletIcon } from 'lucide-react'
import WithdrawToExternal from '@/components/WithdrawToExternal'

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-background to-secondary/10"
    >
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center text-2xl font-bold text-primary">
            <WalletIcon className="mr-2 h-6 w-6" />
            Wallet Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <WalletGenerator
                user={currentUser}
                wallet={walletSolana}
                onWalletCreated={(wallet: Wallet) => setWalletSolana(wallet)}
              />
            </div>
            {walletSolana && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Wallet Details</h2>
                <WalletDetails
                  user={currentUser}
                  wallet={walletSolana}
                  onWalletDelete={() => setWalletSolana(null)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {walletSolana && (
        <Card className="mt-6 max-w-4xl mx-auto">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link href="/transactions" className="w-full sm:w-auto">
                <Button variant="default" className="w-full sm:w-auto">
                  <ScrollText className="mr-2 h-4 w-4" />
                  Transactions
                </Button>
              </Link>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
                <WithdrawToExternal wallet={walletSolana} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
