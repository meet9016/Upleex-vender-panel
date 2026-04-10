import AddServicePage from '@/pages/service/AddServicePage'
import React, { Suspense } from 'react'
import PageLoader from '@/components/common/PageLoader'

const page = () => {
  return (
    <div>
      <Suspense fallback={<PageLoader fullScreen={true} />}>
        <AddServicePage />
      </Suspense>
    </div>
  )
}

export default page
