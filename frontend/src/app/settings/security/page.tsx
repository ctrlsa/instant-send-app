'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Lock, Unlock, Shield, Download, Trash2 } from 'lucide-react'
import { useInitData } from '@telegram-apps/sdk-react'
import { checkPasswordExists, createPassword, login, removePassword } from '@/utils/auth'
import { motion } from 'framer-motion'
import WalletDetails from '@/components/WalletDetails'
import { useWallet } from '@/contexts/WalletContext'
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
import { retrieveMnemonic, deleteMnemonic, hasMnemonic } from '@/utils/solanaUtils'

export default function SecurityPage() {
  const [password, setPassword] = useState('')
  const { walletSolana, setWalletSolana, userId } = useWallet()
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationPassword, setVerificationPassword] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [mnemonicBackedUp, setMnemonicBackedUp] = useState(false)
  const [hasMnemonicPhrase, setHasMnemonicPhrase] = useState(false)

  const initData = useInitData()
  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  useEffect(() => {
    if (userId) {
      checkPasswordExists(userId).then(setHasPassword)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      const exists = hasMnemonic(userId)
      setHasMnemonicPhrase(exists)
      setMnemonicBackedUp(exists)
    }
  }, [userId])

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

  const handleBackupMnemonic = async () => {
    if (!userId) return
    try {
      const mnemonic = retrieveMnemonic(userId)

      try {
        await navigator.clipboard.writeText(mnemonic)
        toast.success('Recovery phrase copied to clipboard')
      } catch (clipboardError) {
        // If clipboard fails, show the phrase in UI
        setShowMnemonic(true)
        toast.info('Please copy your recovery phrase manually')
      }

      setMnemonicBackedUp(true)
    } catch (error) {
      toast.error('Failed to retrieve recovery phrase')
    }
  }

  const handleDeleteMnemonic = () => {
    if (!userId) return
    try {
      deleteMnemonic(userId)
      setMnemonicBackedUp(false)
      setShowMnemonic(false)
      setHasMnemonicPhrase(false)
      toast.success('Recovery phrase deleted from this device')
    } catch (error) {
      toast.error('Failed to delete recovery phrase')
    }
  }

  return (
    <div className="min-h-screen overflow mt-32 mb-32 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          )}

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Wallet Backup</h3>
            <div className="space-y-4">
              <WalletDetails
                user={currentUser}
                wallet={walletSolana}
                onWalletDelete={() => setWalletSolana(null)}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    {hasMnemonicPhrase ? 'Backup Recovery Phrase' : 'No Recovery Phrase Available'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {hasMnemonicPhrase ? 'Your Recovery Phrase' : 'No Recovery Phrase'}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      {hasMnemonicPhrase ? (
                        <>
                          <p className="text-yellow-600 dark:text-yellow-500">
                            ⚠️ Never share your recovery phrase with anyone. Store it safely.
                          </p>
                          <Button
                            onClick={handleBackupMnemonic}
                            variant="outline"
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Copy Recovery Phrase
                          </Button>
                          {showMnemonic && (
                            <div className="mt-4 p-4 bg-muted rounded-md">
                              <p className="text-sm font-mono break-all select-all">
                                {userId ? retrieveMnemonic(userId) : ''}
                              </p>
                            </div>
                          )}
                          {mnemonicBackedUp && (
                            <Button
                              onClick={handleDeleteMnemonic}
                              variant="destructive"
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Recovery Phrase
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-center space-y-4">
                          <p>No recovery phrase is currently stored on this device.</p>
                          <p className="text-sm text-muted-foreground">
                            If you&apos;ve previously backed up your recovery phrase, keep it safe.
                            If you need to restore your wallet, you&apos;ll need to use that phrase.
                          </p>
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
