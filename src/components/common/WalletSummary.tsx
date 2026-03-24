"use client";
import React from "react";
import Link from "next/link";
import { WalletIcon, ArrowRightIcon } from "@/icons";
import { useWallet } from "@/context/WalletContext";

const WalletSummary: React.FC = () => {
  const { balance, currency, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
            <WalletIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Wallet Balance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Available funds
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {currency}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <Link
        href="/wallet"
        className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-lg transition-colors group"
      >
        Manage Wallet
        <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Link>

      {balance < 100 && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            💡 Low balance! Add money to avoid payment failures.
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletSummary;