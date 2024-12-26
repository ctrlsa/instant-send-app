'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Wallet } from '@/utils/wallet'
import { useInitData } from '@telegram-apps/sdk-react'

interface WalletContextType {
  walletSolana: Wallet | null
  setWalletSolana: (wallet: Wallet | null) => void
  userId: string | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let userId: string | null = null
  try {
    const initData = useInitData()
    userId = initData?.user?.id.toString() || null
  } catch (error) {
    console.warn('Telegram SDK not available, wallet will use default storage')
  }

  const walletKey = userId ? `Solana_wallet_${userId}` : 'Solana_wallet'

  const [walletSolana, setWalletSolana] = useState<Wallet | null>(() =>
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(walletKey) || 'null') : null
  )

  useEffect(() => {
    if (walletSolana) {
      localStorage.setItem(walletKey, JSON.stringify(walletSolana))
    } else {
      localStorage.removeItem(walletKey)
    }
  }, [walletSolana, walletKey])

  return (
    <WalletContext.Provider
      value={{
        walletSolana,
        setWalletSolana,
        userId
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
