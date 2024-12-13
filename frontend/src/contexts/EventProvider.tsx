'use client'

import React, { createContext, useEffect, PropsWithChildren } from 'react'
import { off, on } from '@telegram-apps/sdk-react'
import { useRouter } from 'next/navigation'

// Create a context
const EventContext = createContext({})

// Create a provider component
export const EventProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter()

  useEffect(() => {
    const handleBackButtonPressed = () => {
      console.log('backButtonPressed event received')
      router.back()
    }

    console.log('Registering back_button_pressed event listener')
    on('back_button_pressed', handleBackButtonPressed)

    // Cleanup function to remove the event listener
    return () => {
      console.log('Removing back_button_pressed event listener')
      off('back_button_pressed', handleBackButtonPressed)
    }
  }, [])

  return <EventContext.Provider value={{}}>{children}</EventContext.Provider>
}
