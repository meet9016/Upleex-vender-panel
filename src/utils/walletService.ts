import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

export interface AddMoneyRequest {
  amount: number;
  paymentMethod?: string;
}

export interface AddMoneyResponse {
  success: boolean;
  transactionId: string;
  message: string;
}

class WalletService {
  async getBalance(): Promise<WalletBalance> {
    try {
      const response = await api.get(endPointApi.getWalletBalance);
      return response.data.data || { balance: 0, currency: "₹" };
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      throw new Error("Failed to fetch wallet balance");
    }
  }

  async addMoney(request: AddMoneyRequest): Promise<AddMoneyResponse> {
    try {
      if (request.amount < 50) {
        throw new Error("Minimum amount is ₹50");
      }

      const response = await api.post(endPointApi.addWalletMoney, request);
      return response.data;
    } catch (error: any) {
      console.error("Error adding money:", error);
      throw new Error(error.response?.data?.message || "Failed to add money");
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await api.get(endPointApi.getWalletTransactions);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw new Error("Failed to fetch transactions");
    }
  }

  validateAmount(amount: number): { isValid: boolean; error?: string } {
    if (!amount || amount <= 0) {
      return { isValid: false, error: "Please enter a valid amount" };
    }
    
    if (amount < 50) {
      return { isValid: false, error: "Minimum amount is ₹50" };
    }
    
    return { isValid: true };
  }

  formatCurrency(amount: number, currency: string = "₹"): string {
    return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export const walletService = new WalletService();
export default walletService;