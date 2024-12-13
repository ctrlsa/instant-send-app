import type { PropsWithChildren } from 'react'
import type { Metadata } from 'next'

import { Root } from '@/components/Root/Root'
import Navbar from '@/components/NavBar'
import Auth from '@/components/Auth'

import '@telegram-apps/telegram-ui/dist/styles.css'
import 'normalize.css/normalize.css'
import './_assets/globals.css'
import { ThemeProvider } from '@/components/themeprovider'
import { Toaster } from '@/components/ui/sonner'
import { WalletProvider } from '@/contexts/WalletContext'
import { CSPostHogProvider } from '@/contexts/PostHogProvider'
import { NavigationProvider } from '@/contexts/NavigationProvider'
import BottomNav from '@/components/BottomNav'
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  Loader2Icon
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Instant Send App by CTRL',
  description: 'Instant Send App by CTRL'
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <NavigationProvider>
          <CSPostHogProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <WalletProvider>
                <Toaster
                  position="top-center"
                  icons={{
                    success: <CheckCircleIcon className="text-green-500" />,
                    info: <InfoIcon className="text-blue-500" />,
                    warning: <AlertTriangleIcon className="text-yellow-500" />,
                    error: <AlertCircleIcon className="text-red-500" />,
                    loading: <Loader2Icon className="text-blue-500" />
                  }}
                />{' '}
                <Root>
                  <Navbar />
                  <Auth>
                    <main className="pt-16 pb-16"> {children}</main>
                  </Auth>

                  <BottomNav />
                </Root>
              </WalletProvider>
            </ThemeProvider>
          </CSPostHogProvider>
        </NavigationProvider>
      </body>
    </html>
  )
}
