'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Unlock, Eye, EyeOff, Info } from 'lucide-react'
import ctrl from '@/app/_assets/ctrl.svg'
import Image from 'next/image'
import { useInitData } from '@telegram-apps/sdk-react'
import {
  checkPasswordExists,
  login,
  createPassword,
  checkAuthenticationValidity,
  clearAuthenticationTimestamp
} from '@/utils/auth'
import { toast } from 'sonner'

interface AuthProps {
  children: React.ReactNode
}

export default function Auth({ children }: AuthProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)

  const initData = useInitData()

  const currentUser = React.useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  useEffect(() => {
    if (currentUser) {
      checkPasswordExists(currentUser.id)
        .then((exists) => {
          setHasPassword(exists)
          if (!exists || checkAuthenticationValidity(currentUser.id)) {
            setIsAuthenticated(true)
          }
        })
        .catch(() => {
          setHasPassword(false)
          setIsAuthenticated(true)
        })
    }
  }, [currentUser])

  const handleAuth = async (password: string) => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      if (hasPassword) {
        const success = await login(currentUser, password)
        if (success) {
          toast.success('Login successful.')
          setIsAuthenticated(true)
        } else {
          setError('Login failed. Please try again.')
        }
      } else {
        const success = await createPassword(currentUser, password)
        if (success) {
          setHasPassword(true)
          setIsAuthenticated(true)
          toast.success('Password created successfully.')
        } else {
          setError('Password creation failed. Please try again.')
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!hasPassword && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    await handleAuth(password)
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  //   const handleLogout = () => {
  //     if (currentUser) {
  //       clearAuthenticationTimestamp(currentUser.id);
  //       setIsAuthenticated(false);
  //     }
  //   };

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background mt-16">
      <Image src={ctrl} alt="ctrl" width={50} data-testid="ctrl-image" className="m-10" />

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            {hasPassword ? 'Welcome Back' : 'Create Your Password'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {hasPassword ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Unlock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {!hasPassword && (
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
              </div>
            )}
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                (!hasPassword && !password) ||
                (!hasPassword && password !== confirmPassword)
              }
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {hasPassword ? 'Unlock your Wallet' : 'Create Your Password'}
            </Button>
            {!hasPassword ? (
              <div className="flex items-center space-x-2 rounded-md border px-4 py-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">
                  This password cannot be recovered. Make sure to remember it or write it down
                  somewhere safe.
                </span>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
