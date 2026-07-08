import type { Metadata } from "next";
import React from "react";
import DashboardContent from "@/components/ecommerce/DashboardContent";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title:
    "Upleex Vendor Panel",
  description: "Vendor management dashboard for Upleex",
};

export default function Ecommerce() {
  return <DashboardContent />;
}
