"use client"
import React from 'react'
import { useRouter } from 'next/navigation';
const PlanTable = () => {
  const router = useRouter();
  return (
    <div>PlanTable
      <button onClick={() =>  router.push(`/plan/addPlan`)}>Add Plan</button>
    </div>
  )
}

export default PlanTable