"use client";

import { useState, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
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
import { useWallet } from "@/contexts/WalletContext";
import { Wallet } from "@/utils/wallet";
import bs58 from "bs58";
import nacl from "tweetnacl";

type Token = {
  symbol: string;
  balance: number;
  icon: JSX.Element;
  mintAddress: string;
};

type Contact = {
  id: string;
  name: string;
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

  useEffect(() => {
    const conn = new Connection("https://api.devnet.solana.com", "confirmed");
    setConnection(conn);

    const fetchTokenBalances = async () => {
      if (!walletSolana || !conn) return;

      const tokenList = [
        {
          symbol: "SOL",
          icon: <TokenSOL variant="branded" />,
          mintAddress: "So11111111111111111111111111111111111111112",
        },
        {
          symbol: "USDC",
          icon: <TokenUSDC variant="branded" />,
          mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        },
        {
          symbol: "BRZ",
          icon: <TokenBZR variant="branded" />,
          mintAddress: "FtgGSFADXBtroxq8VCausXRr2of47QBf5AS1NtZCu4GD",
        },
      ];

      const userPublicKey = new PublicKey(walletSolana.publicKey);

      const balances = await Promise.all(
        tokenList.map(async (token) => {
          if (token.symbol === "SOL") {
            const balance = await conn.getBalance(userPublicKey);
            return { ...token, balance: balance / LAMPORTS_PER_SOL };
          } else {
            const mintPublicKey = new PublicKey(token.mintAddress);
            const tokenAccount = await getAssociatedTokenAddress(
              mintPublicKey,
              userPublicKey
            );
            try {
              let accountInfo;
              try {
                accountInfo = await getAccount(conn, tokenAccount);
              } catch (error) {
                // If the account doesn't exist, create it
                if (
                  error instanceof Error &&
                  error.message.includes("could not find account")
                ) {
                  const transaction = new Transaction().add(
                    createAssociatedTokenAccountInstruction(
                      userPublicKey,
                      tokenAccount,
                      userPublicKey,
                      mintPublicKey
                    )
                  );
                  const signature = await sendTransaction(transaction, conn);
                  await conn.confirmTransaction(signature, "confirmed");
                  accountInfo = await getAccount(conn, tokenAccount);
                } else {
                  throw error;
                }
              }
              return {
                ...token,
                balance: Number(accountInfo.amount) / 1e6,
              };
            } catch (error) {
              console.error(
                `Error fetching balance for ${token.symbol}:`,
                error
              );
              return { ...token, balance: 0 };
            }
          }
        })
      );

      setTokens(balances);
      setLoading(false);
    };

    fetchTokenBalances();
  }, [walletSolana]);

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
      console.log("Sending", sendAmount, selectedToken.symbol, "to", recipient);
      const recipientPubkey = new PublicKey(
        "2syVfoPMEmBNoqn3PH8kwAffqkU7pzidvFGdQNYekvn7"
      );
      const amountInDecimals = parseFloat(sendAmount) * 10 ** 6;

      if (amountInDecimals > selectedToken.balance * 1e6) {
        toast.error(
          `Insufficient ${selectedToken.symbol} balance for this transfer`
        );
        setLoading(false);
        return;
      }

      const fromPubkey = new PublicKey(walletSolana.publicKey);
      console.log("From pubkey", fromPubkey.toBase58());
      const mintPubkey = new PublicKey(selectedToken.mintAddress);

      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        fromPubkey
      );
      const toTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );

      let transaction = new Transaction();

      // Check if the sender's token account exists
      const fromTokenAccountInfo = await connection.getAccountInfo(
        fromTokenAccount
      );
      if (!fromTokenAccountInfo) {
        console.log("Creating associated token account for sender");
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey,
            fromTokenAccount,
            fromPubkey,
            mintPubkey
          )
        );
      }

      // Check if the recipient's token account exists
      const toTokenAccountInfo = await connection.getAccountInfo(
        toTokenAccount
      );
      if (!toTokenAccountInfo) {
        console.log("Creating associated token account for recipient");
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey,
            toTokenAccount,
            recipientPubkey,
            mintPubkey
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromPubkey,
          BigInt(amountInDecimals),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Sign transaction
      const signedTransaction = await signTransaction(
        transaction,
        walletSolana
      );

      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );
      await connection.confirmTransaction(signature, "confirmed");

      toast.success(
        `Sent ${sendAmount} ${selectedToken.symbol} to ${recipient}`
      );
      setSelectedToken(null);
      setSendAmount("");
      setRecipient("");
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

  const signTransaction = async (
    transaction: Transaction,
    wallet: Wallet
  ): Promise<Transaction> => {
    const message = transaction.serializeMessage();
    const secretKey = bs58.decode(wallet.privateKey);
    const signature = nacl.sign.detached(message, secretKey);
    transaction.addSignature(
      new PublicKey(wallet.publicKey),
      Buffer.from(signature)
    );
    return transaction;
  };

  const sendTransaction = async (
    transaction: Transaction,
    connection: Connection
  ): Promise<string> => {
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    if (!walletSolana) {
      throw new Error("Wallet is not connected");
    }
    const signed = await signTransaction(transaction, walletSolana);
    const rawTransaction = signed.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction);
    return signature;
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
        )}
      </CardContent>
    </Card>
  );
}
