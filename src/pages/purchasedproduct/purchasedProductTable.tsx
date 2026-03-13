"use client";

import React, { useMemo } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/tables/AgGridTable";

type PurchasedRow = {
  id: string;
  product_name: string;
  category_name: string;
  plan_type: string;
  amount: number;
  start_at: string;
  expire_at: string;
  status: string;
};

const dummyRows: PurchasedRow[] = [
  {
    id: "P-1001",
    product_name: "Canon EOS R5 Camera",
    category_name: "Electronics",
    plan_type: "premium",
    amount: 109,
    start_at: "2026-03-01",
    expire_at: "2027-03-01",
    status: "active",
  },
  {
    id: "P-1002",
    product_name: "DJI Mavic Air 2",
    category_name: "Drones",
    plan_type: "standard",
    amount: 59,
    start_at: "2026-02-10",
    expire_at: "2026-07-10",
    status: "approved",
  },
  {
    id: "P-1003",
    product_name: "iMac 27-inch",
    category_name: "Computers",
    plan_type: "basic",
    amount: 39,
    start_at: "2026-01-15",
    expire_at: "2026-03-15",
    status: "expired",
  },
];

export default function PurchasedProductsPage() {
  const columns: ColDef<PurchasedRow>[] = useMemo(
    () => [
      { field: "product_name", headerName: "Product", minWidth: 220 },
      { field: "category_name", headerName: "Category", minWidth: 160 },
      { field: "plan_type", headerName: "Plan", minWidth: 120 },
      {
        field: "amount",
        headerName: "Amount",
        minWidth: 120,
        valueFormatter: (p) => (p.value !== undefined && p.value !== null ? `₹${p.value}` : "-"),
      },
      {
        field: "start_at",
        headerName: "Start",
        minWidth: 140,
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleDateString() : "-"),
      },
      {
        field: "expire_at",
        headerName: "Expire",
        minWidth: 140,
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleDateString() : "-"),
      },
      { field: "status", headerName: "Status", minWidth: 120 },
    ],
    []
  );

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Purchased Products</h1>
        <p className="text-slate-500">Showing dummy data for now</p>
      </div>
      <AgGridTable rowData={dummyRows} columns={columns} tableName="Purchased Products" />
    </div>
  );
}