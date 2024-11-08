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
import { ExternalLink, Link2, LinkIcon, ScrollText } from 'lucide-react'

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
      transition={{ duration: 0.5 }}
      className="min-h-screen p-4"
    >
      <Card>
        <CardHeader>
          <CardTitle> Wallet Management</CardTitle>
        </CardHeader>
        <CardContent>
          <WalletGenerator
            user={currentUser}
            wallet={walletSolana}
            onWalletCreated={(wallet: Wallet) => setWalletSolana(wallet)}
          />
          {walletSolana && (
            <WalletDetails
              user={currentUser}
              wallet={walletSolana}
              onWalletDelete={() => setWalletSolana(null)}
            />
          )}
        </CardContent>
      </Card>
      {walletSolana && (
        <div className="flex flex-row p-3 items-center justify-between">
          <Link href="/transactions">
            <Button variant="default" className="text-xs">
              Transactions &nbsp;
              <ScrollText className="h-3 w-3 " />
            </Button>
          </Link>
          <div>
            <Button variant="secondary" className="text-xs">
              View on Explorer &nbsp;
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
