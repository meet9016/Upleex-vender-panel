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
    { field: "product_name", headerName: "Product Name", width: 300 },
    { field: "category_name", headerName: "Category Name", width: 200 },
    { field: "sub_category_name", headerName: "Sub Category", width: 200 },
    { field: "product_type_name", headerName: "Product Type", width: 300 },
    { field: "price", headerName: "Price", width: 200 },
    { field: "cancel_price", headerName: "Cancel Price", width: 200 },
    { field: "product_listing_type_name", headerName: "Listing Type", width: 200 },
    {
      headerName: "Action",
      pinned: "right",
      width: 80,
      cellRenderer: (params: any) => {
        const id = params.data.product_id;

        return (
        <div className="flex items-center gap-3 w-full h-full">
  <button
    onClick={() => router.push(`/product/addProduct?id=${id}`)}
    className="text-xl transition"
    style={{ color: 'rgb(53, 66, 237)' }}
    title="Edit"
  >
    <MdModeEdit />
  </button>

  <button
    onClick={() => openDeletePopup(id)}
    className="text-xl transition opacity-80 hover:opacity-100"
    style={{ color: 'rgb(58, 140, 237)' }}
    title="Delete"
  >
    <MdDelete />
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