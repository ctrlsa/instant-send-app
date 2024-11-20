import instance from '@/utils/axios'
import { Contact } from '@/types/index'

export const contactsApi = {
  getContacts: async (userId: string, initData: any): Promise<Contact[]> => {
    const response = await instance.get(`contacts/getContacts/${userId}`, {
      params: {
        initData: JSON.stringify(initData)
      }
    })
    return response.data
  },

  deleteContact: async (userId: string, contactId: string): Promise<void> => {
    await instance.delete(`contacts/deleteContact/${userId}/${contactId}`)
  }
}

export const walletApi = {
  addWallet: async (userId: string, userName: string, solanaAddress: string): Promise<void> => {
    await instance.post(`wallet/addWallet`, {
      id: userId,
      name: userName,
      solanaAddress
    })
  },

  deleteWallet: async (userId: string): Promise<void> => {
    await instance.delete(`wallet/deleteSolanaWallet/${userId}`)
  }
}
