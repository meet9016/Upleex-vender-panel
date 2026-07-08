"use client";

import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import DashboardFilter from "@/components/ecommerce/DashboardFilter";
import ProductDistributionChart from "@/components/ecommerce/ProductDistributionChart";
import ServiceStatusChart from "@/components/ecommerce/ServiceStatusChart";
import CustomerChart from "@/components/ecommerce/CustomerChart";
import PurchasedPlanChart from "@/components/ecommerce/PurchasedPlanChart";
import { useKyc } from "@/context/KycContext";

export default function DashboardContent() {
  const { vendorType } = useKyc();
  
  const shouldShowServicesChart = vendorType && (vendorType.toLowerCase() === 'service' || vendorType.toLowerCase() === 'both');
  const chartColSpan = shouldShowServicesChart ? "lg:col-span-3" : "lg:col-span-4";
  
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Dashboard Filter & Title */}
      <div className="col-span-12">
        <DashboardFilter />
      </div>

      {/* Row 1: Key Metrics */}
      <div className="col-span-12">
        <EcommerceMetrics />
      </div>

      {/* Row 2: Side-by-side charts on large screens */}
      <div className="col-span-12 lg:col-span-6">
        <StatisticsChart />
      </div>

      <div className="col-span-12 lg:col-span-6">
        <MonthlySalesChart />
      </div>

      {/* Row 3: Pie charts */}
      <div className={`col-span-12 ${chartColSpan}`}>
        <CustomerChart />
      </div>

      <div className={`col-span-12 ${chartColSpan}`}>
        <ProductDistributionChart />
      </div>

      <div className={`col-span-12 ${chartColSpan}`}>
        <PurchasedPlanChart />
      </div>

      {shouldShowServicesChart && (
        <div className={`col-span-12 ${chartColSpan}`}>
          <ServiceStatusChart />
        </div>
      )}

    </div>
  );
}