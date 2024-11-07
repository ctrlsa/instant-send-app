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

const settingsOptions = [
  { id: "general", label: "General", icon: Settings },
  { id: "explorer", label: "View Wallet on Explorer", icon: ExternalLink },
  { id: "transactions", label: "View Wallet Transactions", icon: List },
  { id: "support", label: "Support", icon: HelpCircle },
  { id: "about", label: "About", icon: Info },
];

const SettingsPage = () => {
  const [selectedOption, setSelectedOption] = useState("general");

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
                    onClick={() => setSelectedOption(option.id)}
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
