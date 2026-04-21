"use client";
import React, { useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";
ModuleRegistry.registerModules([AllCommunityModule]);

const PlanTable = () => {



  return (
    <div>
    
    </div>
  );
};

export default PlanTable;
