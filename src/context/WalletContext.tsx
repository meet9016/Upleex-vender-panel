// context/WalletContext.tsx
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

// Default value for SSR
const defaultWalletContext: WalletContextType = {
  balance: 0,
  currency: "₹",
  isLoading: false,
  refreshBalance: async () => {},
  addMoney: async () => {},
};

const WalletContext = createContext<WalletContextType>(defaultWalletContext);

export const useWallet = () => {
  return useContext(WalletContext); // No error throwing now
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [currency] = useState<string>("₹");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  // Fetch balance from API
  const refreshBalance = useCallback(async () => {
    if (!mounted) return; // Don't fetch during SSR
    
    try {
      const timestamp = Date.now();
      const response = await api.get(`${endPointApi.getWalletBalance}?t=${timestamp}`);
      if (response.data.success) {
        setBalance(response.data.data?.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  }, [mounted]);

  // Add money to wallet
  const addMoney = async (amount: number) => {
    if (!mounted) throw new Error("Cannot add money during SSR");
    
    try {
      const response = await api.post(endPointApi.addWalletMoney, { amount });
      await refreshBalance();
      return response.data;
    } catch (error) {
      console.error("Error adding money:", error);
      throw error;
    }
  };

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load balance on mount
  useEffect(() => {
    if (mounted) {
      const loadBalance = async () => {
        setIsLoading(true);
        await refreshBalance();
        setIsLoading(false);
      };
      loadBalance();
    }
  }, [mounted, refreshBalance]);

  // Listen for wallet update events
  useEffect(() => {
    if (!mounted) return;
    
    const handleWalletUpdate = async () => {
      await refreshBalance();
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
  }, [mounted, refreshBalance]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [mounted, refreshBalance]);

  const value: WalletContextType = {
    balance,
    currency,
    isLoading,
    refreshBalance,
    addMoney,
  };

  // During SSR or before mount, return default context
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;