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
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt={serviceName}
                className="w-14 h-14 object-cover rounded-lg border"
                onError={(e: any) => {
                  if (e.target.src !== DEFAULT_PLACEHOLDER) {
                    e.target.src = DEFAULT_PLACEHOLDER;
                  }
                }}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800 dark:text-white">
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
      flex: 1,
      minWidth: 100,
      valueFormatter: (params) => {
        return params.value ? `₹${Number(params.value).toFixed(2)}` : '₹0.00';
      },
    },
    {
      field: "duration",
      headerName: "Duration",
      flex: 1,
      minWidth: 120,
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
      width: 120,
      pinned: 'right',
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => (
        <ActionButtons
          onEdit={() => router.push(`/service/addService?id=${params.data._id || params.data.id}`)}
          onDelete={() => openDeletePopup(params.data._id || params.data.id)}
        />
      ),
    },
  ];

  const getServiceData = async () => {
    try {
      setLoading(true);
      const res = await api.get(endPointApi.postAllVendorServiceList);
      setServiceData(res?.data?.data || []);
    } catch (error) {
      console.log("fetch error", error);
      // toast.error("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getServiceData();
  }, []);

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Services</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-64"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => router.push('/service/addService')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            + Add Service
          </button>
        </div>
      </div>

      <AgGridTable
        columns={columns}
        rowData={serviceData}
        filter={false}
        tableName="Services"
        loading={loading}
      />

      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ServiceTable;
