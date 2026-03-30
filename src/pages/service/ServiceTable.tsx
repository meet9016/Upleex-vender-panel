"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import { MdDelete, MdModeEdit, MdSearch, MdMoreVert, MdBlock } from "react-icons/md";
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
};

const ServiceTable = () => {
  const router = useRouter();
  const [serviceData, setServiceData] = useState<Service[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
              <span className="font-medium text-[13px] text-gray-800 dark:text-white truncate" title={serviceName}>
                {serviceName}
              </span>
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
        params: { search }
      });
      setServiceData(res?.data?.data || []);
    } catch (error) {
      console.log("fetch error", error);
      // toast.error("Failed to fetch services");
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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white">Services</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search services..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full sm:w-64"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => router.push('/service/addService')}
            className="w-full sm:w-auto px-4 py-2 btn-primary font-medium whitespace-nowrap"
          >
            <span className="hidden sm:inline">+ Add Service</span>
            <span className="sm:hidden">+ Add</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <AgGridTable
            columns={columns}
            rowData={serviceData}
            filter={false}
            tableName="Services"
            loading={loading}
            rowHeight={52}
          />
        </div>
      </div>

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
