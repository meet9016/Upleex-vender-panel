"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import { MdDelete, MdModeEdit } from "react-icons/md";
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';

type Product = {
  id: string;
  product_name: string;
  category_name: string;
  sub_category_name: string;
  product_type_name: string;
  cancel_price: string;
  product_listing_type_name: string;
  price: number;
};

const ProductTable = () => {
  const router = useRouter();


  const [productData, setProductData] = useState<Product[]>([]);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const columns: ColDef[] = [
    { field: "product_name", headerName: "Product Name", minWidth: 200, cellStyle: { textAlign: "center" } },
    { field: "category_name", headerName: "Category Name", minWidth: 200, cellStyle: { textAlign: "center" } },
    { field: "sub_category_name", headerName: "Sub Category", minWidth: 200, cellStyle: { textAlign: "center" } },
    { field: "product_type_name", headerName: "Product Type", minWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "price", headerName: "Price", minWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "cancel_price", headerName: "Cancel Price", minWidth: 100, cellStyle: { textAlign: "center" } },
    { field: "product_listing_type_name", headerName: "Listing Type", minWidth: 150, cellStyle: { textAlign: "center" } },
    {
      headerName: "Action",
      // pinned: "right",
      minWidth: 80,
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => {
        const id = params.data.product_id;

        return (
          <div className="flex items-center justify-center gap-3 w-full h-full">
            <button
              onClick={() => router.push(`/product/addProduct?id=${id}`)}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white transition"
              title="Edit"
            >
              <MdModeEdit className="text-base" />
            </button>

            <button
              onClick={() => openDeletePopup(id)}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#E55353] text-[#E55353] hover:bg-[#E55353] hover:text-white transition"
              title="Delete"
            >
              <MdDelete className="text-base" />
            </button>
          </div>

        );
      },
    },
  ];

  const getProductData = async () => {
    try {
      const res = await api.post(endPointApi.postAllVendorProductList);
      setProductData(res?.data?.data);
    } catch (error) {
      console.log("fetch error", error);
    }
  };

  useEffect(() => {
    getProductData();
  }, []);

  const openDeletePopup = (id: number) => {

    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const deleteById = async (id: number | string) => {
    try {
      const formdata = new FormData();
      formdata.append("product_id", String(id));

      const res = await api.post(endPointApi.postDeleteVendorProductList, formdata);
      // toast.success("Deleted successfully");
      getProductData(); // refresh table
    } catch (error) {
      // toast.error("Delete failed");
    }
  };

  const confirmDelete = async () => {

    if (!deleteId) return;

    await deleteById(deleteId);
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div>
      <AgGridTable
        columns={columns}
        rowData={productData}
        filter={false}
        buttonName={"Product"}
        tableName={"Product"}
        addButtonLink={(`/product/addProduct`)}
      />
      <ConfirmDeleteModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={confirmDelete}
      />

    </div>
  )
}

export default ProductTable