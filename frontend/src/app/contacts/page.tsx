"use client";
import Contacts from "@/components/Contacts";
import { useWallet } from "@/contexts/WalletContext";
import instance from "@/utils/axios";
import { useInitData } from "@telegram-apps/sdk-react";
import { useEffect, useMemo, useState } from "react";
const ContactsPage = () => {
  const initData = useInitData();
  const [contacts, setContacts] = useState([]);
  const { walletSolana } = useWallet();

  const currentUser = useMemo(() => {
    if (!initData?.user) return undefined;
    const { id, username, firstName, lastName } = initData.user;
    return { id: id.toString(), username, name: `${firstName} ${lastName}` };
  }, [initData]);

  const getContacts = async () => {
    if (currentUser?.id) {
      const res = await instance.get(`contacts/getContacts/${currentUser.id}`, {
        params: {
          initData: JSON.stringify(initData),
        },
      });
      setContacts(res.data);
    }
  };

  useEffect(() => {
    if (currentUser) {
      getContacts();
    }
  }, [currentUser]);

  return (
    <div className="p-2">
      <Contacts
        isOpen={true}
        user={currentUser}
        contacts={contacts}
        handleRefresh={getContacts}
      />
    </div>
  );
};

export default ContactsPage;
