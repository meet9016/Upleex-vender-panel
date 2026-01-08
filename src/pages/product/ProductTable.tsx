"use client"
import React from 'react'
import { useRouter } from 'next/navigation';
const ProductTable = () => {
  const router = useRouter();
  return (
    <div>ProductTable
      <button onClick={() =>  router.push(`/product/addProduct`)}>Add Product</button>
    </div>
  )
}

export default ProductTable