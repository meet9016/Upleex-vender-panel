"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";

interface FilterState {
  service: boolean;
  vendor: boolean;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  canFilter: boolean;
  setCanFilter: (val: boolean) => void;
  isLoadingFilter: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    service: false,
    vendor: false,
  });
  const [canFilter, setCanFilter] = useState(true);
  const [isLoadingFilter, setIsLoadingFilter] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          if (mounted) setIsLoadingFilter(false);
          return;
        }
        
        const res = await api.get(`${endPointApi.postFetchVendorKYCFormData}`);
        if (res.status === 200 && res.data?.data) {
          const data = res.data.data;
          const hasData = (data.completed_pages && data.completed_pages.length > 0) || data.id;
          
          if (hasData) {
            if (mounted) setCanFilter(false);
            const savedType = data.vendor_type;
            if (savedType) {
              if (mounted) {
                setFilters({
                  service: savedType === "service" || savedType === "both",
                  vendor: savedType === "vendor" || savedType === "both",
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("FilterContext fetch error:", err);
      } finally {
        if (mounted) {
          setIsLoadingFilter(false);
        }
      }
    };

    fetchStatus();
    return () => { mounted = false; };
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, canFilter, setCanFilter, isLoadingFilter }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    // Return safe defaults during SSR/prerender
    return {
      filters: { service: false, vendor: false },
      setFilters: () => {},
      canFilter: true,
      setCanFilter: () => {},
      isLoadingFilter: false,
    };
  }
  return context;
}
