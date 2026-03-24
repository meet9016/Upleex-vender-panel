"use client";
import React from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon, WalletIcon } from "@/icons";

interface WalletBalanceProps {
  balance: number;
  currency: string;
  onAddMoney: () => void;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
  balance,
  currency,
  onAddMoney,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
      {/* Gradient top bar */}
      <div className="h-2 bg-gradient-to-r from-brand-500 to-brand-700" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20">
            <WalletIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Wallet Balance
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Available balance
            </p>
          </div>
        </div>

        {/* Balance Amount */}
        <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {currency}
            {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Add Money Button */}
        <Button
          onClick={onAddMoney}
          startIcon={<PlusIcon />}
          className="w-full"
          size="md"
        >
          Add Money
        </Button>

        {/* Note */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Minimum amount to add is ₹50
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;