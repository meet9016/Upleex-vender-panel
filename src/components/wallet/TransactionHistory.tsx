"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";
import PageLoader from "@/components/common/PageLoader";
import { FiMoreVertical } from "react-icons/fi";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { exportWalletTransactionsToExcel, exportWalletTransactionsToPDF } from "@/utils/exportUtils";
import Loader from "@/components/common/Loader";
import { toast } from "react-toastify";

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  listing_type?: string;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  loading?: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions = [],
  loading = false,
}) => {
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 600);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true);
      const params = {
        type: filter === "all" ? undefined : filter,
        search: debouncedSearch.trim() || undefined,
      };
      await exportWalletTransactionsToExcel(params);
      toast.success("Transactions exported to Excel successfully!");
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to export to Excel");
    } finally {
      setExcelLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const params = {
        type: filter === "all" ? undefined : filter,
        search: debouncedSearch.trim() || undefined,
      };
      await exportWalletTransactionsToPDF(params);
      toast.success("Transactions exported to PDF successfully!");
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to export to PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50";
      case "pending":
        return "text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50";
      case "failed":
        return "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50";
      default:
        return "text-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtered = (transactions || []).filter((t) => {
    const matchesFilter = filter === "all" ? true : t.type === filter;
    const matchesSearch = searchText.trim() === "" 
      ? true 
      : t.description.toLowerCase().includes(searchText.toLowerCase()) || 
        t.id.toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalCredit = (transactions || [])
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = (transactions || [])
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden flex mt-2 flex-col h-[700px] relative">
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-transparent">
          <PageLoader fullScreen={false} />
        </div>
      )}
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Transaction History
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {(transactions || []).length} total transaction{(transactions || []).length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white transition-all duration-200"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
                {(["all", "credit", "debit"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all duration-150 ${filter === f
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Actions Menu */}
              <div className="relative" ref={actionsMenuRef}>
                <button
                  onClick={() => setShowActionsMenu((v) => !v)}
                  className="w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all duration-300"
                  title="Export options"
                >
                  <FiMoreVertical className="text-xl" />
                </button>

                {showActionsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                 
                    <div className="py-1">
                      <button
                        onClick={handleExportExcel}
                        disabled={excelLoading || pdfLoading}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200 disabled:opacity-50"
                      >
                        <FaFileExcel className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                        <span>Export to Excel</span>
                        {excelLoading && <Loader className="ml-auto text-emerald-600 w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={handleExportPDF}
                        disabled={excelLoading || pdfLoading}
                        className="group w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-200 disabled:opacity-50"
                      >
                        <FaFilePdf className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                        <span>Export to PDF</span>
                        {pdfLoading && <Loader className="ml-auto text-rose-600 w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {(transactions || []).length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                <ArrowDownIcon className="w-4 h-4 text-green-600 dark:text-green-400 ml-1 mt-1" />
              </div>
              <div>
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">Total Added</p>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">
                  ₹{totalCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                <ArrowUpIcon className="w-4 h-4 text-red-600 dark:text-red-400 ml-1 mt-1" />
              </div>
              <div>
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">Total Spent</p>
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  ₹{totalDebit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">
              {filter === "all" ? "No transactions yet" : `No ${filter} transactions`}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your wallet transactions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                      transaction.type === "credit"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    {transaction.type === "credit" ? (
                      <ArrowDownIcon className="w-4 h-4 text-green-600 dark:text-green-400 ml-1 mt-1" />
                    ) : (
                      <ArrowUpIcon className="w-4 h-4 text-red-600 dark:text-red-400 ml-1 mt-1" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                      </p>
                      {transaction.listing_type && (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                          {transaction.listing_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                  <p
                    className={`text-sm font-semibold ${
                      transaction.type === "credit"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {transaction.type === "credit" ? "+" : "-"}₹
                    {transaction.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      getStatusColor(transaction.status)
                    }`}
                  >
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
