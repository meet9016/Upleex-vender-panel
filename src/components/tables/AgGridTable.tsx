"use client";
const consoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("AG Grid Enterprise License") ||
     args[0].includes("License Key Not Found") ||
     args[0].includes("unlocked for trial"))
  ) {
    return;
  }
  consoleError(...args);
};

import React, { useMemo, useRef, memo, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ColDef, ModuleRegistry, RowSelectionOptions } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { ColumnMenuModule, ContextMenuModule } from "ag-grid-enterprise";

ModuleRegistry.registerModules([AllCommunityModule, ColumnMenuModule, ContextMenuModule]);

interface AgGridTableProps {
  tableName?: string;
  buttonName?: string;
  addButtonLink?: string;
  rowData: any[];
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
  columns?: ColDef[];
  filter?: boolean;
}

const AgGridTable: React.FC<AgGridTableProps> = ({
  tableName = "Table",
  buttonName = "",
  addButtonLink = "",
  rowData,
  onDelete,
  onEdit,
  columns,
}) => {
  const router = useRouter();
  const gridRef = useRef<any>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
const defaultColDef = useMemo(
  () => ({
    sortable: true,
    resizable: true,
    cellStyle: { display: 'flex', alignItems: 'center', paddingLeft: '16px' },
    headerClass: "ag-left-aligned-header",
  }),
  []
);


  const defaultColumns: ColDef[] = useMemo(
    () => [
    { 
      field: "planName", 
      headerName: "Plan Name",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      flex: 1,
      minWidth: 200,
    },
    { field: "price", headerName: "Price", flex: 0.6, minWidth: 100 },
    { field: "duration", headerName: "Duration", flex: 0.8, minWidth: 120 },
    { field: "day", headerName: "Day", flex: 0.5, minWidth: 80 },
    { field: "month", headerName: "Month", flex: 0.6, minWidth: 100 },
    { field: "rocket", headerName: "Rocket", flex: 1.5, minWidth: 200 },
    {
      headerName: "Action",
      pinned: "right",
      width: 140,
      suppressSizeToFit: true,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      cellRenderer: (params: any) => {
        const id = params.data.id;
        return (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onEdit ? onEdit(id) : router.push(`/plan/edit/${id}`)}
              className="text-lg text-slate-500 hover:text-brand-600 transition"
              aria-label="Edit"
            >
              <MdModeEdit />
            </button>
            <button
              onClick={() => onDelete ? onDelete(id) : alert(`Delete clicked for ID: ${id}`)}
              className="text-lg text-slate-400 hover:text-red-500 transition"
              aria-label="Delete"
            >
              <MdDelete />
            </button>
          </div>
        );
      },
    },
    ],
    [onEdit, onDelete, router]
  );

  const rowSelection = useMemo<RowSelectionOptions>(
    () => ({ mode: "multiRow" }),
    []
  );

  const onGridReady = useCallback((params: any) => {
    params.api.sizeColumnsToFit();
  }, []);

  const handleAddClick = useCallback(() => {
    router.push(addButtonLink);
  }, [router, addButtonLink]);


  return (
    <div>
      <div className="flex justify-between items-center mb-4 dark:text-gray-200">
        <h2 className="text-xl font-bold">{tableName}</h2>
        {buttonName && (
          <button onClick={handleAddClick} className="btn-primary" aria-label={`Add ${buttonName}`}>
            + Add {buttonName}
          </button>
        )}
      </div>

      <div className={`${isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'} cute-ag-grid`} style={{ width: "100%", height: "80vh" }}>
        <AgGridReact
          rowHeight={tableName === "Quotes" ? 60 : 35}
          ref={gridRef}
          rowData={rowData}
          columnDefs={columns || defaultColumns}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={20}
          rowSelection={rowSelection}
          onGridReady={onGridReady}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          columnMenu="new"
          suppressRowClickSelection
          animateRows
          suppressHorizontalScroll={true}
        />
      </div>
    </div>
  );
};

export default memo(AgGridTable);