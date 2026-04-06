"use client";
import React, { useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";
// import AgGridTable from "@/components/tables/AgGridTable";
ModuleRegistry.registerModules([AllCommunityModule]);

const PlanTable = () => {
  // const { setBreadcrumbs } = useBreadcrumb();

  // useEffect(() => {
  //   setBreadcrumbs([{ label: "Plan" }]);
  //   return () => setBreadcrumbs(null);
  // }, [setBreadcrumbs]);

  return (
    <div>
      {/* <AgGridTable 
       buttonName={"Plan"}
       tableName={"Plan"}
       addButtonLink={(`/plan/addPlan`)}
      /> */}
    </div>
  );
};

export default PlanTable;
