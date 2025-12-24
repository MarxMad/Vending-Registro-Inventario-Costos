"use client";

import { motion } from "framer-motion";
import { useMiniApp } from "@neynar/react";
import { UserButton } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/server";

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
  clerkUser?: User | null;
};

export function Header({ clerkUser }: HeaderProps) {
  const { context } = useMiniApp();

  return (
    <div className="relative">
      {(context?.user || clerkUser) && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mt-4 mb-4 mx-4 flex items-center justify-end"
        >
          {clerkUser ? (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 border-2 border-blue-500",
                },
              }}
            />
          ) : context?.user?.pfpUrl ? (
            <img 
              src={context.user.pfpUrl} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-blue-500 shadow-lg"
            />
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
