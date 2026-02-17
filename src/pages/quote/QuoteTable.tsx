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
  _id: string;
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

  const columns: ColDef[] = [
{
  headerName: "Product",
  field: "product_name",
  width: 240,
  sortable: true,
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
},
    { field: "product_type_name", headerName: "Product Type", width: 180, cellStyle: { textAlign: "center" } },
    { field: "product_listing_type_name", headerName: "Product Listing Type", width: 220, cellStyle: { textAlign: "center" } },
    { field: "delivery_date", headerName: "Delivery Date", width: 150, cellStyle: { textAlign: "center" } },
    { field: "start_date", headerName: "Start Date", width: 150, cellStyle: { textAlign: "center" } },
    { field: "end_date", headerName: "End Date", width: 150, cellStyle: { textAlign: "center" } },
    { field: "month_name", headerName: "Month", width: 120, cellStyle: { textAlign: "center" } },
    {
      field: "qty",
      headerName: "Qty",
      width: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      valueFormatter: (params) =>
        params.value ? `₹${Number(params.value).toFixed(2)}` : "₹0.00",
      cellStyle: { textAlign: "center" },
    },
    {
      field: "total_price",
      headerName: "Total",
      width: 120,
      valueFormatter: (params) =>
        params.value ? `₹${Number(params.value).toFixed(2)}` : "₹0.00",
      cellStyle: { textAlign: "center", fontWeight: "600" },
    },
    {
      field: "status_text",
      headerName: "Status",
      width: 130,
      cellStyle: { textAlign: "center" },
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
    {
      headerName: "Actions",
      width: 300,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center justify-center gap-2 h-full">
            <button
              onClick={() => handleApproval(params.data._id)}
              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            >
              Approval
            </button>
            <button
              onClick={() => handleRejected(params.data._id)}
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Rejected
            </button>
            <button
              onClick={() => router.push(`/quote/edit/${params.data.quote_id}`)}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Edit
            </button>
          </div>
        );
      },
    },
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

  const handleApproval = (id: string) => {
    alert(`Approval clicked for ID: ${id}`);
    // Yahan aap API call kar sakte ho
  };

  const handleRejected = (id: string) => {
    alert(`Rejected clicked for ID: ${id}`);
    // Yahan aap API call kar sakte ho
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
      />

    </div>
  );
};

export default QuoteTable;
