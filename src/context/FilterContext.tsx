"use client";

import React, { createContext, useContext, useState } from "react";

interface FilterState {
  service: boolean;
  vendor: boolean;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  canFilter: boolean;
  setCanFilter: (val: boolean) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    service: false,
    vendor: false,
  });
  const [canFilter, setCanFilter] = useState(true);

  return (
    <FilterContext.Provider value={{ filters, setFilters, canFilter, setCanFilter }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}
