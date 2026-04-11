"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchTransactions = useCallback(async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      const response = await api.get(endPointApi.getWalletTransactions, {
        params: { page: pageNum, limit: 20 }
      });

      if (response.data.success) {
        const newTransactions = response.data.data.transactions || [];
        const pagination = response.data.data.pagination;

        if (pageNum === 1) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }

        setHasMore(pageNum < (pagination?.pages || 1));
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetchingMore) {
      fetchTransactions(page + 1);
    }
  }, [hasMore, isFetchingMore, page, fetchTransactions]);

  useEffect(() => {
    const loadData = async () => {
      // Balance can refresh independently
      refreshBalance();
      // Fetch first page of transactions
      fetchTransactions(1);
    };
    loadData();
  }, [refreshBalance, fetchTransactions]);

  // Listen for wallet updates to refresh transaction history
  useEffect(() => {
    const handleWalletUpdate = async () => {
      await fetchTransactions(1);
      await refreshBalance();
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
  }, [refreshBalance, fetchTransactions]);


  return (
    <div className="mx-auto">

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
          <TransactionHistory
            transactions={transactions}
            loading={isLoading}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            onLoadMore={handleLoadMore}
          />
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
