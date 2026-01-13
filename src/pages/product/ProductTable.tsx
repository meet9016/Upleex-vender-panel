"use client"
import React from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
import { ColDef } from 'ag-grid-community';
import { MdDelete, MdModeEdit } from "react-icons/md";

const ProductTable = () => {
  const router = useRouter();
  const rowData = [
  {
    id: 1,
    planName: "Basic",
    price: "1008",
    duration: "30 Days",
    day: 20,
    month: 25,
    rocket: "ELV-1, Guiana Space Centre, French Guiana, France",
  },
  {
    id: 2,
    planName: "Premium",
    price: "250",
    duration: "90 Days",
    day: 20,
    month: 25,
    rocket: "ELV-1, Guiana Space Centre, French Guiana, France",
  },
  {
    id: 3,
    planName: "Pro",
    price: "500",
    duration: "180 Days",
    day: 20,
    month: 25,
    rocket: "ELV-1, Guiana Space Centre, French Guiana, France",
  },
];

  const columns: ColDef[] = [
    { field: "planName", headerName: "Plan Name", width: 200 },
    { field: "price", headerName: "Price", width: 200 },
    { field: "duration", headerName: "Duration", width: 200 },
    { field: "day", headerName: "Day", width: 200 },
    { field: "month", headerName: "Month", width: 200 },
    { field: "rocket", headerName: "Rocket", width: 300 },
    {
      headerName: "Action",
      pinned: "right",
      width: 130,
      cellRenderer: (params: any) => {
        const id = params.data.id;
        return (
          <div className="flex items-center justify-center gap-3 w-full h-full">
            <button
              // onClick={() => (onEdit ? onEdit(id) : router.push(`/plan/edit/${id}`))}
              className="text-xl text-blue-600"
            >
              <MdModeEdit />
            </button>
            <button
              // onClick={() => (onDelete ? onDelete(id) : alert(`Delete clicked for ID: ${id}`))}
              className="text-xl text-red-600"
            >
              <MdDelete />
            </button>
          </div>
        );
      },
    },
  ];
  return (
    <div>
      <AgGridTable
      columns={columns}
       rowData={rowData} 
       filter={false}
       buttonName={"Product"}
       tableName={"Product"}
       addButtonLink={(`/product/addProduct`)}
      />

    </div>
  )
}

export default ProductTable