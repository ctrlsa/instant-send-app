'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronsUpDown,
  Contact as ContactIcon,
  Trash,
  RefreshCw,
  Info,
  Search,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Card, CardContent } from '@/components/ui/card'
import { contactsApi } from '@/services/api'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Contact } from '@/types/index'

interface ContactsProps {
  contacts: Contact[]
  handleRefresh: () => void
  user: any
  isOpen?: boolean
  isFetching?: boolean
}

export default function Contacts({
  contacts = [],
  handleRefresh = () => {},
  user,
  isOpen,
  isFetching
}: ContactsProps) {
  const [isOpenCollapsible, setIsOpenCollapsible] = useState(isOpen ? true : false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const filteredContacts = useMemo(() => {
    return contacts.filter(
      (contact) =>
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [contacts, searchQuery])

  const handleDeleteContact = async (contactId: string) => {
    try {
      setIsLoading(true)
      console.log('deleting')
      await contactsApi.deleteContact(user.id, contactId)
      toast.success('Contact deleted successfully')
      handleRefresh()
    } catch (err) {
      toast.error('Error deleting contact')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyUsername = useCallback((username: string) => {
    if (username) {
      navigator.clipboard.writeText(username)
      toast.success('Username copied to clipboard')
    } else {
      toast.error('No username found, invite the user to InstantSendAppBot to get their username')
    }
  }, [])

  return (
    <motion.div animate={isOpenCollapsible ? 'open' : 'closed'}>
      <div className="flex flex-row items-center justify-between mt-3 ml-3 ">
        <ContactIcon className="h-4 w-4" />
        <span>Contacts</span>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpenCollapsible(!isOpenCollapsible)}
          className="w-9 p-0"
          aria-expanded={isOpenCollapsible}
          aria-label="Toggle contacts list"
        >
          <ChevronsUpDown className="h-4 w-3" />
        </motion.button>
      </div>
      <AnimatePresence initial={false}>
        {isOpenCollapsible && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.5, ease: [0, 0, 0.58, 1] }}
            className="flex flex-col space-y-2"
          >
            <div className="flex justify-between items-center mt-2">
              <div className="relative flex-1 mr-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-2 w-full"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading || isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="max-h-[300px] overflow-auto space-y-2">
              {filteredContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {contact.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{contact.name}</p>
                          {/* <p className="text-xs text-gray-500">
                            @{contact.username}
                          </p> */}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyUsername(contact.username)}
                          aria-label={`Copy ${contact.name}'s username`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button> */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label={`Delete ${contact.name}`}>
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {contact.name} from your contacts?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteContact(contact.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredContacts.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 py-4">No contacts found</div>
            )}
            {isLoading && (
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-[80px] w-full" />
                ))}
              </div>
            )}
            <div className="flex items-center space-x-2 rounded-md border px-4 py-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">
                To add more contacts, share a contact to @InstantSendAppBot
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
