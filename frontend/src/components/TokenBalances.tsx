"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenBZR, TokenSOL, TokenUSDC } from "@web3icons/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet } from "@/utils/wallet";

type Token = {
  symbol: string;
  balance: number;
  icon: string | JSX.Element;
};

type Contact = {
  id: string;
  name: string;
};

type TokenBalancesProps = {
  wallet: Wallet;
  contacts: Contact[];
};

export default function TokenBalances({
  wallet,
  contacts,
}: TokenBalancesProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  useEffect(() => {
    const fetchTokenBalances = async () => {
      // Simulating API call to fetch token balances
      //   await new Promise((resolve) => setTimeout(resolve, 1500));
      setTokens([
        { symbol: "SOL", balance: 10.5, icon: <TokenSOL variant="branded" /> },
        { symbol: "USDC", balance: 100, icon: <TokenUSDC variant="branded" /> },
        { symbol: "BRZ", balance: 50, icon: <TokenBZR variant="branded" /> },
      ]);
      setLoading(false);
    };

    fetchTokenBalances();
  }, [wallet]);

  const handleSend = async () => {
    if (!selectedToken || !sendAmount || !recipient) return;

    setLoading(true);
    // Simulating token transfer
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);

    toast(`Sent ${sendAmount} ${selectedToken.symbol} to ${recipient}`);

    setSelectedToken(null);
    setSendAmount("");
    setRecipient("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
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
                        {token.balance}
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
        )}
      </CardContent>
    </Card>
  );
}
