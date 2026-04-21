import React from "react";
import PayoutHistory from "@/pages/payouts/PayoutHistory";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Release History | Upleex Vendor",
  description: "View and track your released payments for Rent and Sell transactions.",
};

const PayoutsPage = () => {
  return (
    <div className="p-4 md:p-6">
      <PayoutHistory />
    </div>
  );
};

export default PayoutsPage;
