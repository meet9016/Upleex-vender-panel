"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface KycContextType {
  kycApproved: boolean | null;
  isLoading: boolean;
  vendorType: string | null;
  refreshKycStatus: () => Promise<void>;
}

const KycContext = createContext<KycContextType | undefined>(undefined);

export function KycProvider({ children }: { children: React.ReactNode }) {
  const [kycApproved, setKycApproved] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('kyc_approved');
      if (cached !== null) return cached === 'true';
    }
    return null;
  });
  const [vendorType, setVendorType] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vendor_type');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kyc_approved') === null;
    }
    return true;
  });

  const fetchKycStatus = async () => {
    try {
      const res = await api.post(endPointApi.postFetchVendorKYCFormData as string);
      const status = res?.data?.data?.status || "";
      const vendorTypeFromApi = res?.data?.data?.vendor_type || "";
      const isApproved = String(status).toLowerCase() === "approved";
      
      setKycApproved(isApproved);
      setVendorType(vendorTypeFromApi);
      localStorage.setItem('kyc_approved', String(isApproved));
      localStorage.setItem('vendor_type', vendorTypeFromApi);
    } catch (error) {
      if (kycApproved === null) {
        setKycApproved(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      fetchKycStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <KycContext.Provider value={{ kycApproved, isLoading, vendorType, refreshKycStatus: fetchKycStatus }}>
      {children}
    </KycContext.Provider>
  );
}

export function useKyc() {
  const context = useContext(KycContext);
  if (context === undefined) {
    throw new Error("useKyc must be used within a KycProvider");
  }
  return context;
}
