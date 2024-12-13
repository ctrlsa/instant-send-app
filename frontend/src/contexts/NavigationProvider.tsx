'use client'

import React, { createContext, useEffect, PropsWithChildren } from 'react'
import { off, on } from '@telegram-apps/sdk-react'
import { useRouter } from 'next/navigation'

const NavigationContext = createContext({})

export const NavigationProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter()

  useEffect(() => {
    const handleBackButtonPressed = () => {
      console.log('backButtonPressed')
      router.back()
    }

    on('back_button_pressed', handleBackButtonPressed)

    return () => {
      off('back_button_pressed', handleBackButtonPressed)
    }
  }, [])

  return <NavigationContext.Provider value={{}}>{children}</NavigationContext.Provider>
}
