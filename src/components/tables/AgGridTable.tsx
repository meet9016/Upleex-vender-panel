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
import React, { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  RowSelectionOptions,
} from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";

// ✅ Enterprise modules for column menu (three dots)
import { ColumnMenuModule, ContextMenuModule } from "ag-grid-enterprise";

// ✅ Register modules - make sure ALL are from the same version
ModuleRegistry.registerModules([
  AllCommunityModule,    // 35.1.0
  ColumnMenuModule,      // 35.1.0
  ContextMenuModule,     // 35.1.0
]);

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
  filter,
}) => {
  const router = useRouter();
  const gridRef = useRef<any>(null);

  // ✅ Column defaults - menu enabled
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      // filter: filter,
      resizable: true,
      flex: 1,
      minWidth: 120,
      cellClass: "flex items-center text-sm",
      headerClass: "font-semibold text-slate-700",
      // suppressMenu is REMOVED - we want the three dots!
    }),
    [filter]
  );

  // Default columns (fallback)
  const defaultColumns: ColDef[] = [
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
              onClick={() =>
                onEdit ? onEdit(id) : router.push(`/plan/edit/${id}`)
              }
              className="text-lg text-slate-500 hover:text-brand-600 transition"
            >
              <MdModeEdit />
            </button>
            <button
              onClick={() =>
                onDelete ? onDelete(id) : alert(`Delete clicked for ID: ${id}`)
              }
              className="text-lg text-slate-400 hover:text-red-500 transition"
            >
              <MdDelete />
            </button>
          </div>
        );
      },
    },
  ];

  const rowSelection = useMemo<RowSelectionOptions>(
    () => ({ mode: "multiRow" }),
    []
  );

  const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
  };


  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{tableName}</h2>

        {buttonName && (
          <button
            onClick={() => router.push(addButtonLink)}
            className="btn-primary"
          >
            + Add {buttonName}
          </button>
        )}
      </div>

      {/* AG GRID */}
      <div
        className="ag-theme-alpine cute-ag-grid"
        style={{ width: "100%", height: "80vh" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columns || defaultColumns}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={10}
          rowSelection={rowSelection}
          // suppressHorizontalScroll={true}
          onGridReady={onGridReady}
           paginationPageSizeSelector={[10, 20, 50, 100]}
          // ✅ Enable three-dot column menu
          columnMenu="new"
        />
      </div>
    </div>
  );
};

export default AgGridTable;