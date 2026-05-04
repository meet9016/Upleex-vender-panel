"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import { MdDelete, MdModeEdit, MdSearch, MdMoreVert, MdBlock, MdClose } from "react-icons/md";
import { FiMoreVertical } from "react-icons/fi";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import ActionButtons from "@/components/common/ActionButtons";
import StatusBadge from "@/components/common/StatusBadge";
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { CiFilter } from "react-icons/ci";
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/modal';
import Loader from '@/components/common/Loader';
import { exportServicesToExcel, exportServicesToPDF } from '@/utils/exportUtils';
import { useWallet } from '@/context/WalletContext';

const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'24\' y=\'24\' font-family=\'Arial\' font-size=\'10\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E';

type Service = {
  id: string;
  service_name: string;
  category_name: string;
  price: number;
  duration: string;
  status: string;
  image?: string;
  _id?: string;
  is_priority?: boolean;
};

const ServiceTable = () => {
  const router = useRouter();
    const { balance } = useWallet();
  const [serviceData, setServiceData] = useState<Service[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
      const params = { search: debouncedSearch.trim() || undefined };
      await exportServicesToExcel(params);
      toast.success("Services exported to Excel successfully!");
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
      const params = { search: debouncedSearch.trim() || undefined };
      await exportServicesToPDF(params);
      toast.success("Services exported to PDF successfully!");
      setShowActionsMenu(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to export to PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Robustly clear hover when mouse is NOT over a trigger
  useEffect(() => {
    if (!hoveredImage) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.hover-zoom-trigger')) {
        setHoveredImage(null);
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [hoveredImage]);

  const columns: ColDef[] = [
    {
      headerName: "Service Name",
      field: "service_name",
      flex: 2,
      minWidth: 200,
      sortable: true,
      cellRenderer: (params: any) => {
        const service = params.data;
        const imageUrl = service?.image || DEFAULT_PLACEHOLDER;
        const serviceName = service?.service_name || "N/A";

        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-shrink-0 relative">
              <img
                src={imageUrl}
                alt={serviceName}
                className="w-9 h-9 object-cover rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition-shadow hover:shadow-md hover-zoom-trigger"
                onMouseEnter={(e: any) => {
                  setHoveredImage(imageUrl);
                  setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e: any) => {
                  setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => {
                  setHoveredImage(null);
                }}
                onError={(e: any) => {
                  if (e.target.src !== DEFAULT_PLACEHOLDER) {
                    e.target.src = DEFAULT_PLACEHOLDER;
                  }
                }}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-[13px] text-gray-800 dark:text-white truncate flex items-center gap-2" title={serviceName}>
                {serviceName}
                {service?.is_priority && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                    Priority
                  </span>
                )}
                {/* {service?.listing_expires_at && new Date(service.listing_expires_at) < new Date() && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold">
                    Expired
                  </span>
                )} */}
              </span>
              {/* {service?.listing_expires_at && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Expires: {new Date(service.listing_expires_at).toLocaleDateString()}
                </span>
              )} */}
            </div>
          </div>
        );
      },
    },
    {
      field: "category_name",
      headerName: "Category",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "price",
      headerName: "Price",
      width: 120,
      valueFormatter: (params) => {
        return params.value ? `₹${Number(params.value).toLocaleString('en-IN')}` : '₹0';
      },
    },
    {
      field: "duration",
      headerName: "Duration",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "approval_status",
      headerName: "Admin Approval",
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value || 'active'} />
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <StatusBadge status={params.value || 'active'} />
        </div>
      ),
    },
    {
      headerName: "Action",
      width: 100,
      minWidth: 100,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => (
        <ActionButtons
          onEdit={() => router.push(`/service/addService?id=${params.data._id || params.data.id}`)}
          onDelete={() => openDeletePopup(params.data._id || params.data.id)}
        />
      ),
    },
  ];

  const getServiceData = async (search = '') => {
    try {
      setLoading(true);
      const res = await api.get(endPointApi.postAllVendorServiceList, {
        params: { 
          search,
          sortBy: 'is_priority', // Ensure priority sorting
          order: 'desc'
        }
      });
      setServiceData(res?.data?.data || []);
    } catch (error) {
      console.log("fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getServiceData(debouncedSearch);
  }, [debouncedSearch]);

  const openDeletePopup = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`${endPointApi.postDeleteVendorServiceList}/${deleteId}`);
      toast.success("Service deleted successfully");
      getServiceData();
    } catch (error) {
      toast.error("Failed to delete service");
    } finally {
      setOpenDeleteModal(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-4 mt-5 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (balance <= 0) {
                toast.error("Insufficient wallet balance. Please add money to your wallet before adding a Service.");
                return;
              }
              router.push('/service/addService')
            }}
            className="px-4 py-2 btn-primary font-medium text-sm whitespace-nowrap"
          >
            + Add Service
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search services..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-48 sm:w-64 text-sm"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <MdClose size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Menu (3-dots) */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu((v) => !v)}
              className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all duration-300"
              title="Export options"
            >
              <FiMoreVertical className="text-xl" />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border border-gray-100/50 dark:border-gray-800/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                {/* <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100/30 dark:border-gray-800/30">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Export Options</span>
                </div> */}

                <div className="py-1">
                  <button
                    onClick={handleExportExcel}
                    disabled={excelLoading || pdfLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFileExcel className="text-lg text-emerald-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to Excel</span>
                    {excelLoading && <Loader className="ml-auto text-emerald-600 w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleExportPDF}
                    disabled={excelLoading || pdfLoading}
                    className="group w-full flex items-center gap-3 px-4 py-3.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 border-l-4 border-transparent hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all duration-200 disabled:opacity-50"
                  >
                    <FaFilePdf className="text-lg text-rose-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">Export to PDF</span>
                    {pdfLoading && <Loader className="ml-auto text-rose-600 w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AgGridTable
        columns={columns}
        rowData={serviceData}
        filter={false}
        tableName="Services"
        loading={loading}
        rowHeight={52}
        height={"650px"}
        noRowsMessage='No services found'
      />

      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      {/* Floating Image Preview */}
      {hoveredImage && (
        <div
          className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
          style={{
            top: mousePos.y + 25,
            left: mousePos.x + 25,
            opacity: hoveredImage ? 1 : 0
          }}
        >
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <img
              src={hoveredImage}
              alt="Preview"
              className="w-48 h-48 object-cover rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceTable;
