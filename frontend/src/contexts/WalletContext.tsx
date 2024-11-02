"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Wallet } from "@/utils/wallet";

interface WalletContextType {
  walletSolana: Wallet | null;
  setWalletSolana: (wallet: Wallet | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [walletSolana, setWalletSolana] = useState<Wallet | null>(() =>
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("Solana_wallet") || "null")
      : null,
  );

  useEffect(() => {
    if (walletSolana) {
      localStorage.setItem("Solana_wallet", JSON.stringify(walletSolana));
    } else {
      localStorage.removeItem("Solana_wallet");
    }
  }, [walletSolana]);

  return (
    <WalletContext.Provider
      value={{
        walletSolana,
        setWalletSolana,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
