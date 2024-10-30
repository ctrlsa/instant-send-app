"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet } from "@/utils/wallet";
import { useInitData } from "@telegram-apps/sdk-react";
import { User, ChevronDown } from "lucide-react";
import instance from "@/utils/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Contacts from "@/components/Contacts";
import WalletDetails from "@/components/WalletDetails";
import WalletGenerator from "@/components/WalletGenerator";
import TokenBalances from "@/components/TokenBalances";
import { useWallet } from "@/contexts/WalletContext";

export default function Home() {
  const initData = useInitData();
  const [contacts, setContacts] = useState([]);
  const { walletSolana, setWalletSolana } = useWallet();
  const [showWalletDetails, setShowWalletDetails] = useState(false);

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
    if (currentUser) getContacts();
  }, [currentUser]);

  useEffect(() => {
    if (!walletSolana) setShowWalletDetails(true);
  }, [walletSolana]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* User Card */}
        <Card
          className="cursor-pointer"
          onClick={() => setShowWalletDetails(!showWalletDetails)}
        >
          <CardContent className="flex flex-col items-center space-y-0 pb-2 mt-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold"
            >
              {currentUser?.name}
            </motion.div>
            <p className="text-xs text-muted-foreground">
              @{currentUser?.username}
            </p>
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: showWalletDetails ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground mt-2" />
            </motion.div>
          </CardContent>
        </Card>

        {/* Wallet Details */}
        {showWalletDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Solana Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <WalletGenerator
                  wallet={walletSolana}
                  onWalletCreated={(wallet: Wallet) => setWalletSolana(wallet)}
                />
                {walletSolana && (
                  <WalletDetails
                    wallet={walletSolana}
                    onWalletDelete={() => setWalletSolana(null)}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contacts */}
        <Card>
          <CardContent>
            <Contacts contacts={contacts} handleRefresh={getContacts} />
          </CardContent>
        </Card>
        {/* Token Balances */}
        {walletSolana && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TokenBalances contacts={contacts} />
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
