"use client";
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WalletBalance from "@/components/wallet/WalletBalance";
import AddMoneyModal from "@/components/wallet/AddMoneyModal";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import { useWallet } from "@/context/WalletContext";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface WalletData {
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

const WalletPage: React.FC = () => {
  const { balance, currency, refreshBalance } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  const fetchTransactions = async () => {
    try {
      const response = await api.get(endPointApi.getWalletTransactions);
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([refreshBalance(), fetchTransactions()]);
      setIsLoading(false);
    };
    loadData();
  }, [refreshBalance]);

  // Listen for wallet updates to refresh transaction history
  useEffect(() => {
    const handleWalletUpdate = async () => {
      await fetchTransactions();
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto md:p-6">
      <PageBreadcrumb pageTitle="Wallet" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Balance Card */}
        <div className="lg:col-span-1">
          <WalletBalance
            balance={balance}
            currency={currency}
            onAddMoney={() => setIsAddMoneyModalOpen(true)}
          />
        </div>

        {/* Right: Transaction History */}
        <div className="lg:col-span-2">
          <TransactionHistory transactions={transactions} />
        </div>
      </div>

      <AddMoneyModal
        isOpen={isAddMoneyModalOpen}
        onClose={() => setIsAddMoneyModalOpen(false)}
      />
    </div>
  );
};

export default WalletPage;