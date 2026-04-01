"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import AgGridTable from "@/components/tables/AgGridTable";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import StatusBadge from "@/components/common/StatusBadge";

type PurchasedRow = {
  id: string;
  product_names: string;
  categories: string;
  plan_type: string;
  amount: number;
  start_at: string;
  expire_at: string;
  status: string;
};

export default function PurchasedProductsPage() {
  const [rows, setRows] = useState<PurchasedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchasedProducts = async () => {
      try {
        setLoading(true);
        const userInfoStr = localStorage.getItem('user_info');
        const vendor = userInfoStr ? JSON.parse(userInfoStr) : null;
        const vendor_id = vendor?.id || vendor?._id;

        const response = await api.get(endPointApi.getPurchasedPlans, {
          params: { vendor_id }
        });
        if (response.data.success && response.data.data) {
          const products = response.data.data.map((item: any) => {
            // Extract product names and categories from populated product_ids
            const productNames = item.product_ids && Array.isArray(item.product_ids)
              ? item.product_ids.map((p: any) => p.product_name || p.name || "-").join(", ")
              : "-";
            
            const categories = item.product_ids && Array.isArray(item.product_ids)
              ? item.product_ids.map((p: any) => p.category_name || p.category || "-").join(", ")
              : "-";

            return {
              id: item._id || item.id,
              product_names: productNames,
              categories: categories,
              plan_type: item.plan_type || "-",
              amount: item.amount || 0,
              start_at: item.start_at || item.createdAt || "",
              expire_at: item.expire_at || "",
              status: item.status || "active",
            };
          });
          setRows(products);
        } else {
          setRows([]);
        }
      } catch (error) {
        console.error("Error fetching purchased products:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedProducts();
  }, []);

  const columns: ColDef<PurchasedRow>[] = useMemo(
    () => [
      { field: "product_names", headerName: "Products", minWidth: 250, wrapText: true, autoHeight: true },
      { field: "categories", headerName: "Categories", minWidth: 200, wrapText: true, autoHeight: true },
      { field: "plan_type", headerName: "Plan Type", minWidth: 120 },
      {
        field: "amount",
        headerName: "Amount",
        minWidth: 120,
        valueFormatter: (p) => (p.value !== undefined && p.value !== null ? `₹${p.value}` : "-"),
      },
      {
        field: "start_at",
        headerName: "Start Date",
        minWidth: 140,
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"),
      },
      {
        field: "expire_at",
        headerName: "Expiry Date",
        minWidth: 140,
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"),
      },
      { field: "status", headerName: "Status", minWidth: 120, cellRenderer: (params: any) => (
              <div className="flex items-center h-full">
                <StatusBadge status={params.value || 'pending'} />
              </div>
            ), },
    ],
    []
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Purchased Plans</h1>
          <p className="text-slate-500">Loading...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Purchased Plans</h1>
        <p className="text-slate-500">{rows.length} plan(s) purchased</p>
      </div>
      <AgGridTable rowData={rows} columns={columns} tableName="Purchased Plans" showCheckboxes={false} />
    </div>
  );
}
