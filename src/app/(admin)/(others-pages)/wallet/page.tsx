"use client";
import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WalletBalance from "@/components/wallet/WalletBalance";
import AddMoneyModal from "@/components/wallet/AddMoneyModal";
import TransactionHistory from "@/components/wallet/TransactionHistory";
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
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    currency: "₹",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletData = async () => {
    try {
      const response = await api.get(endPointApi.getWalletBalance);
      if (response.data.success) {
        setWalletData({
          balance: response.data.data.balance || 0,
          currency: response.data.data.currency || "₹",
        });
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

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
      await Promise.all([fetchWalletData(), fetchTransactions()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleAddMoney = async (amount: number) => {
    try {
      // Create Razorpay order
      const orderResponse = await api.post(endPointApi.addWalletMoney, {
        amount,
      });

      if (!orderResponse.data.success) {
        throw new Error(
          orderResponse.data.message || "Failed to create order"
        );
      }

      const { transaction_id, razorpay_order_id, key } =
        orderResponse.data.data;

      // Initialize Razorpay payment
      const options = {
        key: key,
        amount: amount * 100,
        currency: "INR",
        name: "Upleex",
        description: `Add ₹${amount} to wallet`,
        order_id: razorpay_order_id,
        handler: async function (response: any) {
          try {
            const verifyResponse = await api.post(
              endPointApi.verifyWalletPayment,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transaction_id: transaction_id,
              }
            );

            if (verifyResponse.data.success) {
              await fetchWalletData();
              await fetchTransactions();
              setIsAddMoneyModalOpen(false);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            throw error;
          }
        },
        prefill: {
          name: "Vendor",
          email: "vendor@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error adding money:", error);
      throw error;
    }
  };

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
    <div className="p-4 mx-auto max-w-screen-xl md:p-6">
      <PageBreadcrumb pageTitle="Wallet" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Balance Card */}
        <div className="lg:col-span-1">
          <WalletBalance
            balance={walletData.balance}
            currency={walletData.currency}
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
        onAddMoney={handleAddMoney}
      />
    </div>
  );
};

export default WalletPage;