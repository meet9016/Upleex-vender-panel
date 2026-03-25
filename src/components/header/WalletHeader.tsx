"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { WalletIcon } from "@/icons";
import { useWallet } from "@/context/WalletContext";

const WalletHeader: React.FC = () => {
  const { balance, currency, isLoading, refreshBalance } = useWallet();

  useEffect(() => {
    const handleWalletUpdate = () => {
      refreshBalance();
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
  }, [refreshBalance]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="animate-pulse w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="animate-pulse w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  return (
    <Link
      href="/wallet"
      className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-lg transition-colors group"
    >
      {/* <WalletIcon className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300" /> */}
      <span className="text-sm font-medium text-brand-700 dark:text-brand-300 group-hover:text-brand-800 dark:group-hover:text-brand-200">
        {currency}{balance.toLocaleString('en-IN')}
      </span>
    </Link>
  );
};

export default WalletHeader;