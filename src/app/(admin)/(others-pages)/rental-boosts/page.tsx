"use client";

import React, { useEffect, useState } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { Rocket, Check, Sparkles, TrendingUp, History, Info, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import AgGridTable from "@/components/tables/AgGridTable";
import { ColDef } from "ag-grid-community";
import StatusBadge from "@/components/common/StatusBadge";
import { useRouter } from "next/navigation";
import RentalBoostDialog from "@/components/common/RentalBoostDialog";

export default function RentalBoostsPage() {
  const { setBreadcrumbs } = useBreadcrumb();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [priorityProducts, setPriorityProducts] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showBoostDialog, setShowBoostDialog] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Booster Plan" }]);
    return () => setBreadcrumbs(null);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchPlans();
    fetchPurchases();
    fetchPriorityProducts();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await api.get(endPointApi.getAllRentalBoostPlans, {
        params: { status: "active" },
      });
      if (res?.data?.success) {
        setPlans(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const res = await api.get(endPointApi.getVendorRentalBoostPurchases);
      if (res?.data?.success) {
        setPurchases(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchPriorityProducts = async () => {
    try {
      setLoadingProducts(true);
      const userInfoStr = localStorage.getItem('user_info');
      const vendor = userInfoStr ? JSON.parse(userInfoStr) : null;
      const vendor_id = vendor?.id || vendor?._id;

      // Fetch products that have is_priority: true
      const res = await api.get(endPointApi.postAllVendorProductList, {
        params: {
          vendor_id,
          is_priority: true, // Assuming the backend supports this query Param
          approval_status: 'approved'
        }
      });

      let products = res?.data?.data || [];
      // If backend doesn't support filter, we filter manually
      products = products.filter((p: any) => p.is_priority === true);

      setPriorityProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const columns: ColDef[] = [
    {
      headerName: "Product",
      field: "product_name",
      minWidth: 200,
      flex: 1,
    },
    {
      headerName: "Plan",
      field: "plan_name",
      minWidth: 150,
    },
    {
      headerName: "Price",
      field: "price", // Matches updated controller response
      minWidth: 100,
      valueFormatter: (p) => `₹${p.value}`,
    },
    {
      headerName: "Boost Period",
      minWidth: 200,
      cellRenderer: (params: any) => {
        const start = params.data.start_date ? new Date(params.data.start_date).toLocaleDateString() : '-';
        const end = params.data.expiry_date ? new Date(params.data.expiry_date).toLocaleDateString() : '-';
        return <span className="text-xs">{start} to {end}</span>;
      }
    },
    {
      headerName: "Status",
      field: "payment_status",
      minWidth: 120,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value || 'completed'} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-1 space-y-8">
      {/* Hero Section */}


      {/* Eligible Products Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Eligible Products (With Priority Plan)</h2>
          </div>
          <div className="text-sm text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full">
            {priorityProducts.length} Eligible Products
          </div>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : priorityProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Eligible Products Found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
              You need to have products with an active Priority Plan to use the Booster Plan functionality.
            </p>
            <Button onClick={() => router.push('/purchasedplan')} className="bg-indigo-600">
              Get Priority Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {priorityProducts.map(product => (
              <div key={product._id} className="relative group bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate" title={product.product_name}>
                      {product.product_name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-[#28a8e9]">
                      <Sparkles className="w-3 h-3" />
                      Priority Active
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Status</span>
                    <span className={`text-xs font-bold ${product.is_boosted ? 'text-orange-500' : 'text-gray-500'}`}>
                      {product.is_boosted ? 'Currently Boosted' : 'Not Boosted'}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowBoostDialog(true);
                    }}
                    disabled={product.is_boosted}
                    className={`px-5 py-2 rounded-xl text-xs font-bold ${product.is_boosted ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white'}`}
                  >
                    {product.is_boosted ? 'Boost Active' : 'Apply Boost'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase History</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
          <AgGridTable
            rowData={purchases}
            columns={columns}
            loading={loadingPurchases}
            tableName="Purchased Boosts"
            showCheckboxes={false}
            height="450px"
          />
        </div>
      </div>

      {/* Dialog for Plan Selection */}
      <RentalBoostDialog
        isOpen={showBoostDialog}
        onClose={() => setShowBoostDialog(false)}
        product={selectedProduct}
        onSuccess={() => {
          fetchPurchases();
          fetchPriorityProducts();
        }}
      />
    </div>
  );
}
