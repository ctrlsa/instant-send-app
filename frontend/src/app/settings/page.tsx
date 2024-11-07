"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, ExternalLink, List, Info, HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";

const settingsOptions = [
  {
    id: "general",
    label: "General",
    icon: Settings,
    path: "/settings/general",
  },
  {
    id: "explorer",
    label: "View Wallet on Explorer",
    icon: ExternalLink,
    external: true,
  },
  {
    id: "transactions",
    label: "View Wallet Transactions",
    icon: List,
    path: "/transactions",
  },
  {
    id: "support",
    label: "Support",
    icon: HelpCircle,
    path: "/settings/support",
  },
  { id: "about", label: "About", icon: Info, path: "/settings/about" },
];

const SettingsPage = () => {
  const [selectedOption, setSelectedOption] = useState("general");
  const router = useRouter();
  const { walletSolana } = useWallet();

  const handleOptionClick = (option: (typeof settingsOptions)[0]) => {
    setSelectedOption(option.id);
    if (option.external) {
      if (walletSolana) {
        // Replace with the actual Solana explorer URL
        window.open(
          `https://explorer.solana.com/address/${walletSolana.publicKey}`,
          "_blank"
        );
      } else {
        // Show an error or notification that wallet is not connected
        console.error("Wallet is not connected");
      }
    } else if (option.path && router) {
      console.log(option.path);
      router.push(option.path);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className=" p-4  "
    >
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your app preferences and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="w-full">
              <nav className="space-y-2">
                {settingsOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={selectedOption === option.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleOptionClick(option)}
                  >
                    <option.icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                ))}
              </nav>
            </div>
            <Separator orientation="vertical" className="hidden md:block" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SettingsPage;
