// context/BreadcrumbContext.tsx - COMPLETE REPLACE
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[] | null;
  setBreadcrumbs: (items: BreadcrumbItem[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

// Safe hook that doesn't throw during SSR
export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  
  // During SSR or if no context, return safe default
  if (typeof window === 'undefined' || !context) {
    return {
      breadcrumbs: null,
      setBreadcrumbs: () => {},
    };
  }
  
  return context;
};

export const BreadcrumbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, just render children without provider
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};