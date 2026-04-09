import AddServicePage from '@/pages/service/AddServicePage'
import React, { Suspense } from 'react'

const page = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <AddServicePage />
      </Suspense>
    </div>
  )
}

export default page
