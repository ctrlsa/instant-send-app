"use client";
import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ModeToggle } from "@/components/ui/theme-button";

import ctrl from "@/app/_assets/ctrl.svg";

const Navbar = () => {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setTheme("dark");
  }, []);

  if (!mounted) return null;

  return (
    <nav className="flex justify-between items-center py-4">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-4">
          <span className="tracking-tighter text-xl font-extrabold text-primary flex gap-2 items-center">
            <Image src={ctrl} alt="ctrl" width={40} data-testid="ctrl-image" />
            Instant Send App
          </span>
        </div>
      </div>
      <ModeToggle />
    </nav>
  );
};

export default Navbar;
