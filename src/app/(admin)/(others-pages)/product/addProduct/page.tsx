import React from 'react'
import { Suspense } from "react";
import AddProductPage from '@/pages/product/AddProductPage'

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <AddProductPage />
      </Suspense>
    </div>
  )
}

export default page