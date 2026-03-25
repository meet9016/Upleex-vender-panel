"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface WalletContextType {
  balance: number;
  currency: string;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  addMoney: (amount: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [currency] = useState<string>("₹");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch balance from API
  const refreshBalance = useCallback(async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await api.get(`${endPointApi.getWalletBalance}?t=${timestamp}`);
      if (response.data.success) {
        setBalance(response.data.data?.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  }, []);

  // Add money to wallet (calls backend API)
  const addMoney = async (amount: number) => {
    try {
      const response = await api.post(endPointApi.addWalletMoney, { amount });
      // Refresh balance immediately after adding money
      await refreshBalance();
      return response.data;
    } catch (error) {
      console.error("Error adding money:", error);
      throw error;
    }
  };

  // Load balance on mount
  useEffect(() => {
    const loadBalance = async () => {
      setIsLoading(true);
      await refreshBalance();
      setIsLoading(false);
    };
    loadBalance();
  }, [refreshBalance]);

  // Listen for wallet update events
  useEffect(() => {
    const handleWalletUpdate = async () => {
      await refreshBalance();
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
  }, [refreshBalance]);

  // Auto-refresh balance every 30 seconds (reduced from 10 to minimize API calls)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshBalance]);

  const value: WalletContextType = {
    balance,
    currency,
    isLoading,
    refreshBalance,
    addMoney,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
