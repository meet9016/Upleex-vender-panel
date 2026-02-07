"use client";
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

ModuleRegistry.registerModules([AllCommunityModule]);

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

  // 🔥 CLEAN DEFAULT COLUMN SETTINGS
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: filter,
      suppressMenu: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
      cellClass: "flex items-center text-sm",
      headerClass: "font-semibold text-slate-700",
    }),
    []
  );


  // 🔥 DEFAULT COLUMNS (NO WIDTHS)
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
                onDelete
                  ? onDelete(id)
                  : alert(`Delete clicked for ID: ${id}`)
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
            className="px-4 py-2 bg-brand-600 text-white rounded-md"
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
          suppressHorizontalScroll={true}   // 🔒 NO H-SCROLL
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default AgGridTable;
