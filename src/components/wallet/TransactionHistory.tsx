"use client";
import React, { useState } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";

interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions = [],
}) => {
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");

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

  const filtered =
    filter === "all"
      ? transactions || []
      : (transactions || []).filter((t) => t.type === filter);

  const totalCredit = (transactions || [])
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = (transactions || [])
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Transaction History
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {(transactions || []).length} total transaction{(transactions || []).length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
            {(["all", "credit", "debit"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all duration-150 ${filter === f
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        {(transactions || []).length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                <ArrowDownIcon className="w-4 h-4 text-green-600 dark:text-green-400 rotate-180" />
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
                <ArrowUpIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
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
      <div className="p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
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
                    className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${transaction.type === "credit"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-red-50 dark:bg-red-900/20"
                      }`}
                  >
                    {transaction.type === "credit" ? (
                      <ArrowDownIcon className="w-4 h-4 text-green-600 dark:text-green-400 rotate-180" />
                    ) : (
                      <ArrowUpIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                  <p
                    className={`text-sm font-semibold ${transaction.type === "credit"
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
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                      transaction.status
                    )}`}
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
