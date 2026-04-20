import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

export interface PlanPurchaseRequest {
  plan_type: string;
  product_ids: string[];
  months?: number;
  max_products?: number;
  amount?: number;
}

export interface PlanPurchaseResponse {
  status: number;
  message: string;
  data: {
    _id: string;
    vendor_id: string;
    plan_type: string;
    months: number;
    max_products: number;
    amount: number;
    product_ids: string[];
    start_at: string;
    expire_at: string;
    wallet_balance: number;
  };
}

class PlanPurchaseService {
  async purchasePlan(request: PlanPurchaseRequest): Promise<PlanPurchaseResponse> {
    try {
      const response = await api.post(endPointApi.postPurchasePlan, request);
      
      if (response.data.status === 201 || response.data.success) {
        // Dispatch event to notify wallet context about balance update
        window.dispatchEvent(new Event('walletUpdated'));
        
        return response.data;
      }
      
      throw new Error(response.data.message || "Failed to purchase plan");
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to purchase plan");
    }
  }

  async getPlanOptions() {
    try {
      const response = await api.get(endPointApi.getPlanOptions);
      return response.data.data || [];
    } catch (error) {
      throw new Error("Failed to fetch plan options");
    }
  }

  async submitCustomPlanRequest(mobile: string, productIds: string[] = []) {
    try {
      const response = await api.post(endPointApi.postCustomPlanRequest, {
        mobile,
        product_ids: productIds,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to submit custom plan request");
    }
  }
}

export const planPurchaseService = new PlanPurchaseService();
export default planPurchaseService;
