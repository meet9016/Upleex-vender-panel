"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

type Quote = {
  no: string;
  quote_id: string;
  product_name: string;
  product_type_name: string;
  product_listing_type_name: string;
  delivery_date: string;
  month_name: string;
  qty: string;
  price: string;
  total_price: string;
  status_text: string;
  created_at: string;
};

const QuoteTable = () => {
  const router = useRouter();
  const gridRef = useRef<any>(null);

  const [quoteData, setQuoteData] = useState<Quote[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const columns: ColDef[] = [
{
  headerName: "Product",
  field: "product_name", // main field
  width: 400,
  sortable: true,
  filter: true,
  cellRenderer: (params: any) => {
    const imageUrl = params.data?.product_main_image;
    const productName = params.data?.product_name;

    return (
      <div className="flex items-center gap-3 h-full">
        {/* Image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-14 h-14 object-cover rounded-lg border"
              onError={(e: any) => {
                e.target.src =
                  "https://via.placeholder.com/60x60?text=No+Image";
              }}
            />
          ) : (
            <div className="w-14 h-14 flex items-center justify-center bg-gray-100 text-gray-400 text-xs rounded-lg border">
              No Image
            </div>
          )}
        </div>

        {/* Product Name */}
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            {productName || "N/A"}
          </span>
        </div>
      </div>
    );
  },
}
,
    { field: "product_type_name", headerName: "Product Type", width: 140 },
    { field: "product_listing_type_name", headerName: "Product Listing Type", width: 140 },
    { field: "delivery_date", headerName: "Delivery Date", width: 140 },
    { field: "start_date", headerName: "Start Date", width: 140 },
    { field: "end_date", headerName: "End Date", width: 140 },

    { field: "month_name", headerName: "Month", width: 130 },

    {
      field: "qty",
      headerName: "Qty",
      width: 100,
      cellStyle: { textAlign: "right" },
    },

    {
      field: "price",
      headerName: "Price",
      width: 140,
      valueFormatter: (params) =>
        params.value ? `₹${Number(params.value).toFixed(2)}` : "₹0.00",
      cellStyle: { textAlign: "right" },
    },

    {
      field: "total_price",
      headerName: "Total",
      width: 150,
      valueFormatter: (params) =>
        params.value ? `₹${Number(params.value).toFixed(2)}` : "₹0.00",
      cellStyle: { textAlign: "right", fontWeight: "600" },
    },
    {
      field: "status_text",
      headerName: "Status",
      width: 130,
      cellRenderer: (params: any) => {
        const status = params.value;
        let color =
          status === "Pending"
            ? "text-yellow-600"
            : status === "Approved"
            ? "text-green-600"
            : status === "Rejected"
            ? "text-red-600"
            : "text-gray-600";

        return <span className={`font-medium ${color}`}>{status}</span>;
      },
    },

    { field: "created_at", headerName: "Created At", width: 170 },

   
  ];

  const getQuoteData = async () => {
    try {
      const res = await api.post(endPointApi.postGetQuote);

      if (res?.data?.status === 200) {
        setQuoteData(res.data.data || []);
      }
    } catch (error) {
      console.log("fetch quotes error:", error);
    }
  };

  useEffect(() => {
    getQuoteData();
  }, []);

 
  return (
    <div>
      <AgGridTable
        // ref={gridRef}
        columns={columns}
        rowData={quoteData}
        filter={true}
        tableName="Quotes"
        addButtonLink="/quote/add"
      />

    </div>
  );
};

export default QuoteTable;
