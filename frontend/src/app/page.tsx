'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { postEvent, useInitData, useViewport } from '@telegram-apps/sdk-react'
import { Loader2, QrCode, Share } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import { useWallet } from '@/contexts/WalletContext'
import { contactsApi } from '@/services/api'
import { Contact } from '@/types'
import { RedeemEscrow } from '@/components/RedeemEscrow'
import { tokenList } from '@/utils/tokens'
import { redeemEscrow } from '@/utils/solanaUtils'
import { Connection, PublicKey } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Wallet } from '@/utils/wallet'
import WalletGenerator from '@/components/WalletGenerator'
import Image from 'next/image'

const truncateAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

export default function Home() {
  const initData = useInitData()
  const viewport = useViewport()
  const { setWalletSolana } = useWallet()

  const connection = new Connection('https://api.devnet.solana.com')

  const [contacts, setContacts] = useState<Contact[]>([])
  const { walletSolana } = useWallet()
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showWalletInfo, setShowWalletInfo] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [selectedQrCode, setSelectedQrCode] = useState<any | null>(null)

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  useEffect(() => {
    postEvent('web_app_setup_back_button', {
      is_visible: true
    })
    postEvent('web_app_setup_swipe_behavior', {
      allow_vertical_swipe: false
    })
  }, [])

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
            console.log('Contacts updated successfully')
          }
        }
      } catch (e) {
        console.error(e)
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

  const handleRedeem = async (secret: string, sender: string, token: string) => {
    console.log(secret, sender, token)
    if (!walletSolana) {
      toast.success('Create a wallet to receive tokens')
      return
    }
    if (walletSolana) {
      const balance = await connection.getBalance(new PublicKey(walletSolana.publicKey))
      if (balance === 0) {
        toast.error('Insufficient balance. Please, top up')
        return
      }
    }
    try {
      setIsRedeeming(true)
      await redeemEscrow(
        connection,
        walletSolana,
        token === 'SOL' ? tokenList[0].mintAddress : tokenList[1].mintAddress,
        sender,
        secret,
        token === 'SOL'
      )
      toast.success('Received tokens successfully! Check your wallet.')
    } catch (error) {
      console.error(error)
      toast.error('Invalid link or network error')
    } finally {
      setIsRedeeming(false)
    }
  }

  useEffect(() => {
    if (!initData) return
    if (initData?.startParam) {
      const [secret, sender, token] = initData?.startParam?.split('__')
      if (secret && sender && token) {
        handleRedeem(secret, sender, token)
      }
    }
  }, [])

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      console.error(error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleQrClick = async (publicKey: string) => {
    const qr = await generateQR(publicKey)
    setSelectedQrCode(qr)
    setIsQrModalOpen(true)
    return qr
  }

  const closeModal = () => {
    setIsQrModalOpen(false)
    setSelectedQrCode(null)
  }
  const generateQR = async (text: string) => {
    try {
      const qr = await QRCode.toDataURL(text)
      return qr
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col justify-end h-[70vh] p-4" // Adjust the pb value as needed to account for the footer
    >
      {isRedeeming && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Receiving tokens...</span>
        </div>
      )}

      {walletSolana && (
        <div className="space-y-3">
          {tokenList.map((token) => (
            <div
              key={token.symbol}
              className="bg-secondary rounded-xl p-4 dark:text-white text-black"
            >
              <div className="flex items-center space-x-3">
                {token.icon}
                <div className="flex-1">
                  <h3 className="font-medium">{token.symbol}</h3>
                  <p className="text-xs text-muted-foreground">
                    {truncateAddress(walletSolana.publicKey)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handleQrClick(walletSolana.publicKey)}
                  >
                    <QrCode className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => copyToClipboard(walletSolana.publicKey)}
                  >
                    <Share className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isQrModalOpen && selectedQrCode && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className=" p-4 rounded-lg">
            <div className="flex items-center justify-center">
              <Image
                src={selectedQrCode}
                alt="QR Code"
                width={200}
                height={200}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {walletSolana && <RedeemEscrow />}

        {!walletSolana && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-800 rounded-xl p-6"
          >
            <WalletGenerator
              user={currentUser}
              wallet={walletSolana}
              onWalletCreated={(wallet: Wallet) => setWalletSolana(wallet)}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
