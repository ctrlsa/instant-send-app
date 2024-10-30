"use client";

import { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { tokenList } from "@/utils/tokens";
import { fetchTokenBalances, sendTokens, Token } from "@/utils/solanaUtils";

type Contact = {
  id: string;
  name: string;
  solanaAddress: string;
};

type TokenBalancesProps = {
  contacts: Contact[];
};

export default function TokenBalances({ contacts }: TokenBalancesProps) {
  const { walletSolana } = useWallet();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const updateTokenBalances = useCallback(async () => {
    if (!walletSolana || !connection) return;
    try {
      const balances = await fetchTokenBalances(
        connection,
        walletSolana.publicKey,
        tokenList
      );
      setTokens(balances);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching token balances:", error);
      toast.error("Failed to fetch token balances");
      setLoading(false);
    }
  }, [walletSolana, connection]);

  useEffect(() => {
    const conn = new Connection("https://api.devnet.solana.com", "confirmed");
    setConnection(conn);
  }, []);

  useEffect(() => {
    if (connection) {
      updateTokenBalances();
    }
  }, [connection, updateTokenBalances]);

  const formatBalance = (balance: number) => {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const handleSend = async () => {
    if (
      !selectedToken ||
      !sendAmount ||
      !recipient ||
      !connection ||
      !walletSolana
    ) {
      toast.error("Please fill in all fields and ensure wallet is connected");
      return;
    }

    setLoading(true);
    try {
      const recipientAddress = contacts.find(
        (contact) => contact.id === recipient
      )?.solanaAddress;
      if (recipientAddress != null) {
        await sendTokens(
          connection,
          walletSolana,
          selectedToken,
          sendAmount,
          recipientAddress
        );
        toast.success(
          `Sent ${sendAmount} ${selectedToken.symbol} to ${recipient}`
        );
        setSelectedToken(null);
        setSendAmount("");
        setRecipient("");
        await updateTokenBalances();
      } else {
        toast.error("Recipient not found, Setting up Escrow Account");
        //Implement Escrow Account Logic
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof Error) {
        if (error.message.includes("0x1")) {
          toast.error(
            `Insufficient funds for transfer and fees. Please check your balance.`
          );
        } else {
          toast.error(`Transaction failed: ${error.message}`);
        }
      } else {
        toast.error("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {tokens.map((token) => (
              <motion.div
                key={token.symbol}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
                onClick={() => setSelectedToken(token)}
              >
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <span className="text-2xl mb-2">{token.icon}</span>
                    <h3 className="font-bold">{token.symbol}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatBalance(token.balance)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {selectedToken && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Send {selectedToken.symbol}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedToken(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select onValueChange={setRecipient} value={recipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSend}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send {selectedToken.symbol}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
