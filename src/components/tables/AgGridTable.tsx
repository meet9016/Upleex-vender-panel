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

import React, { useMemo, useRef, memo, useCallback } from "react";
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
const defaultColDef = useMemo(
  () => ({
    sortable: true,
    resizable: true,
    flex: 1,
    cellClass: "flex items-center justify-center text-sm text-center",
    headerClass: "text-center font-semibold text-slate-700",
  }),
  []
);


  const defaultColumns: ColDef[] = useMemo(
    () => [
    { field: "planName", headerName: "Plan Name" },
    { field: "price", headerName: "Price" },
    { field: "duration", headerName: "Duration" },
    { field: "day", headerName: "Day" },
    { field: "month", headerName: "Month" },
    { field: "rocket", headerName: "Rocket", flex: 2 },
    {
      headerName: "Action",
      pinned: "right",
      minWidth: 120,
      cellRenderer: (params: any) => {
        const id = params.data.id;
        return (
          <div className="flex items-center justify-center gap-3 w-full">
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{tableName}</h2>
        {buttonName && (
          <button onClick={handleAddClick} className="btn-primary" aria-label={`Add ${buttonName}`}>
            + Add {buttonName}
          </button>
        )}
      </div>

      <div className="ag-theme-alpine cute-ag-grid" style={{ width: "100%", height: "80vh" }}>
        <AgGridReact
          rowHeight={tableName === "Quotes" ? 60 : 35}
          ref={gridRef}
          rowData={rowData}
          columnDefs={columns || defaultColumns}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={10}
          rowSelection={rowSelection}
          onGridReady={onGridReady}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          columnMenu="new"
          suppressRowClickSelection
          animateRows
        />
      </div>
    </div>
  );
};

export default memo(AgGridTable);