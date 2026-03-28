import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import DashboardFilter from "@/components/ecommerce/DashboardFilter";

export const metadata: Metadata = {
  title:
    "Upleex Vendor Panel",
  description: "Vendor management dashboard for Upleex",
};

export default function Ecommerce() {
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

      {/* Row 2: Earnings & Target */}
      <div className="col-span-12 xl:col-span-12">
        <StatisticsChart />
      </div>

      {/* Row 3: Orders Chart */}
      <div className="col-span-12 xl:col-span-8">
        <MonthlySalesChart />
      </div>

      {/* Row 4: Monthly Target & Other components */}
      <div className="col-span-12 xl:col-span-4">
        <MonthlyTarget />
      </div>

    </div>
  );
}
