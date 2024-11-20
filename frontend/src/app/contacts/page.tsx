'use client'
import Contacts from '@/components/Contacts'
import { useWallet } from '@/contexts/WalletContext'
import { contactsApi } from '@/services/api'
import { useInitData } from '@telegram-apps/sdk-react'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { Contact } from '@/types/index'
const ContactsPage = () => {
  const initData = useInitData()
  const { theme } = useTheme()
  const [contacts, setContacts] = useState<Contact[]>([])
  const { walletSolana } = useWallet()
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined
    const { id, username, firstName, lastName } = initData.user
    return { id: id.toString(), username, name: `${firstName} ${lastName}` }
  }, [initData])

  const getContacts = async () => {
    try {
      setIsFetchingContacts(true)
      if (currentUser?.id) {
        const contacts = await contactsApi.getContacts(currentUser.id, initData)
        setContacts(contacts)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsFetchingContacts(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      getContacts()
    }
  }, [currentUser])
  useEffect(() => {
    if (currentUser) {
      getContacts()
    }
  }, [])

  return (
    <div className={`p-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
      <Contacts
        isOpen={true}
        user={currentUser}
        contacts={contacts}
        handleRefresh={getContacts}
        isFetching={isFetchingContacts}
      />
    </div>
  )
}

export default ContactsPage
