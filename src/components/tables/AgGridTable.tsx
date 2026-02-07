"use client";
import React, { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ColDef, ModuleRegistry, RowSelectionOptions } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";

// Register AG Grid modules
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

  // Default column definitions
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: filter,
      resizable: false, // fixed width
      cellClass: "flex items-center", // vertical center
    }),
    []
  );

  // Default columns if none provided
  const defaultColumns: ColDef[] = [
    { field: "planName", headerName: "Plan Name", width: 150 },
    { field: "price", headerName: "Price", width: 120 },
    { field: "duration", headerName: "Duration", width: 140 },
    { field: "day", headerName: "Day", width: 100 },
    { field: "month", headerName: "Month", width: 100 },
    { field: "rocket", headerName: "Rocket", width: 300 },
    {
      headerName: "Action",
      pinned: "right",
      width: 130,
//       cellStyle: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },
      cellRenderer: (params: any) => {
        const id = params.data.id;
        return (
          <div className="flex items-center justify-center gap-3 w-full h-full">
            <button
              onClick={() => (onEdit ? onEdit(id) : router.push(`/plan/edit/${id}`))}
              className="text-xl text-brand-600"
            >
              <MdModeEdit />
            </button>
            <button
              onClick={() => (onDelete ? onDelete(id) : alert(`Delete clicked for ID: ${id}`))}
              className="text-xl text-red-600"
            >
              <MdDelete />
            </button>
          </div>
        );
      },
    },
  ];

   const rowSelection = useMemo<
    RowSelectionOptions | "single" | "multiple"
  >(() => {
    return { mode: "multiRow" };
  }, []);

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{tableName} Table</h2>

        {buttonName && (
          <button
            onClick={() => router.push(addButtonLink)}
            className="px-4 py-2 bg-brand-600 text-white rounded-md"
          >
            + Add {buttonName}
          </button>
        )}
      </div>

      {/* AG-GRID */}
      <div style={{ width: "100%", height: "80vh" }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columns || defaultColumns}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          rowSelection={rowSelection}
        />
      </div>
    </div>
  );
};

export default AgGridTable;
