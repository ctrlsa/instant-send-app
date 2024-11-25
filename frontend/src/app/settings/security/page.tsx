'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import { useInitData } from '@telegram-apps/sdk-react'
import { checkPasswordExists, createPassword, login, removePassword } from '@/utils/auth'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

export default function SecurityPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationPassword, setVerificationPassword] = useState('')
  const [verificationError, setVerificationError] = useState('')

  const initData = useInitData()
  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  useEffect(() => {
    if (currentUser) {
      checkPasswordExists(currentUser.id).then(setHasPassword)
    }
  }, [currentUser])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const success = await createPassword(currentUser, password)
      if (success) {
        setHasPassword(true)
        toast.success('Password set successfully')
        setPassword('')
        setConfirmPassword('')
      } else {
        setError('Failed to set password')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePassword = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (!currentUser) return

    setIsLoading(true)
    try {
      const isValid = await login(currentUser, verificationPassword)
      if (!isValid) {
        setVerificationError('Incorrect password')
        setIsLoading(false)
        return
      }
      const success = await removePassword(currentUser)
      if (success) {
        setHasPassword(false)
        toast.success('Password protection removed')
        setVerificationPassword('')
        setVerificationError('')
      } else {
        setVerificationError('Failed to remove password protection')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          {hasPassword
            ? 'Your wallet is protected with a password'
            : 'Set a password to protect your wallet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasPassword ? (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Setting Password...' : 'Set Password'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Lock className="h-4 w-4 mr-2" />
                  Remove Password Protection
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Password Protection?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>Please enter your current password to remove protection.</p>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={verificationPassword}
                      onChange={(e) => {
                        setVerificationPassword(e.target.value)
                        setVerificationError('')
                      }}
                    />
                    {verificationError && (
                      <p className="text-sm text-red-500">{verificationError}</p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setVerificationPassword('')
                      setVerificationError('')
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleRemovePassword}
                    disabled={isLoading || !verificationPassword}
                  >
                    {isLoading ? 'Removing...' : 'Remove Protection'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
