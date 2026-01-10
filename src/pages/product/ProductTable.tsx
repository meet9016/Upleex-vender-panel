"use client"
import React from 'react'
import { useRouter } from 'next/navigation';
import AgGridTable from '@/components/tables/AgGridTable';
const ProductTable = () => {
  const router = useRouter();
  return (
    <div>
      <AgGridTable
       buttonName={"Product"}
       tableName={"Product"}
       addButtonLink={(`/product/addProduct`)}
      />

    </div>
  )
}

export default ProductTable