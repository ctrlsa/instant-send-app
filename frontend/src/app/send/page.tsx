"use client";
import { useWallet } from "@/contexts/WalletContext";
import { motion } from "framer-motion";
import TokenBalances from "@/components/TokenBalances";
import { useEffect, useMemo, useState } from "react";
import instance from "@/utils/axios";
import { useInitData } from "@telegram-apps/sdk-react";

const SendPage = () => {
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
    <>
      {walletSolana && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4"
        >
          <TokenBalances contacts={contacts} defaultToken="SOL" />
        </motion.div>
      )}
    </>
  );
};
export default SendPage;
