'use client'
import Contacts from '@/components/Contacts'
import { useWallet } from '@/contexts/WalletContext'
import { contactsApi } from '@/services/api'
import { useInitData } from '@telegram-apps/sdk-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Contact } from '@/types/index'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const ContactsPage = () => {
  const initData = useInitData()
  const { theme } = useTheme()
  const [contacts, setContacts] = useState<Contact[]>([])
  const { walletSolana } = useWallet()
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  const getContacts = useCallback(
    async (isRefreshAction = false) => {
      try {
        isRefreshAction ? setIsRefreshing(true) : setIsFetchingContacts(true)

        if (currentUser?.id) {
          const contacts = await contactsApi.getContacts(currentUser.id, initData)
          setContacts(contacts)
          if (isRefreshAction) {
            toast.success('Contacts updated successfully')
          }
        }
      } catch (e) {
        console.error(e)
        toast.error('Failed to fetch contacts')
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

  return (
    <div className={`p-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
      <Contacts
        isOpen={true}
        user={currentUser}
        contacts={contacts}
        handleRefresh={() => getContacts(true)}
        isFetching={isFetchingContacts}
        isRefreshing={isRefreshing}
      />
    </div>
  )
}

export default ContactsPage
