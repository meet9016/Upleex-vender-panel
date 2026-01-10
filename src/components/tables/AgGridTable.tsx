"use client";
import React, { useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ColDef, ModuleRegistry } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";
ModuleRegistry.registerModules([AllCommunityModule]);

interface AgGridTableProps {
  buttonName?: string;        // dynamic title
  tableName?: string;        // dynamic title
  addButtonLink?: string;    // dynamic add button route
}

const AgGridTable = ({ tableName = "Table",buttonName = "", addButtonLink = "" }: AgGridTableProps) => {
  const router = useRouter();
  const gridRef = useRef<any>(null);

  const [rowData] = useState<any[]>([
    { id: 1, planName: "Basic", price: "1008", duration: "30 Days", day: 20, month: 25, rocket: "ELV-1, Guiana Space Centre, French Guiana, France" },
    { id: 2, planName: "Premium", price: "250", duration: "90 Days", day: 20, month: 25, rocket: "ELV-1, Guiana Space Centre, French Guiana, France"  },
    { id: 3, planName: "Pro", price: "500", duration: "180 Days", day: 20, month: 25,  rocket: "ELV-1, Guiana Space Centre, French Guiana, France"  },
  ]);

  const handleDelete = (id: number) => {
    alert("Delete clicked for ID: " + id);
  };

  // NO WIDTHS HERE (auto adjust)
  const columnDefs: ColDef[] = [
    {
      headerName: "",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: "left",
      maxWidth: 60,
      minWidth: 60,
    },
    { field: "planName", headerName: "Plan Name" },
    { field: "price", headerName: "Price" },
    { field: "duration", headerName: "Duration" },
    { field: "day", headerName: "Day" },
    { field: "month", headerName: "Month" },
    { field: "rocket", headerName: "Rocket" },

    {
      headerName: "Action",
      pinned: "right",
      minWidth: 200,
      cellRenderer: (params: any) => {
        const id = params.data.id;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/plan/edit/${id}`)}
              className="px-3 py-1 text-xl"
            >
              <MdModeEdit />
            </button>

            <button
              onClick={() => handleDelete(id)}
              className="px-3 py-1 text-xl text-red-600"
            >
              <MdDelete />
            </button>
          </div>
        );
      },
    },
  ];

  // AUTO SIZE COLUMNS
  const onGridReady = useCallback((params: any) => {
    gridRef.current = params.api;

    setTimeout(() => {
      const allCols: string[] = [];
      params.columnApi.getColumns().forEach((col: any) => {
        allCols.push(col.getId());
      });

      params.columnApi.autoSizeColumns(allCols, false);
    }, 100);
  }, []);

//   const defaultColDef = useMemo(
//     () => ({
//       sortable: true,
//       filter: false,
//       resizable: true, // user resize ki permission
//     }),
//     []
//   );

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
    };
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{tableName} Table</h2>
{buttonName &&
        <button
          onClick={() => router.push(addButtonLink)}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          + Add {tableName}
        </button>
}
      </div>

      <div style={{ width: "100%", height: "80vh" }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={10}
          rowSelection="multiple"
        />
      </div>
    </div>
  );
};

export default AgGridTable;
