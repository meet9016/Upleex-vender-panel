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
};

import React, { useMemo, useRef, memo, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ColDef, ModuleRegistry, RowSelectionOptions } from "ag-grid-community";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { ColumnMenuModule, ContextMenuModule } from "ag-grid-enterprise";
import PageLoader from "@/components/common/PageLoader";

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
  onSelectionChange?: (rows: any[]) => void;
  loading?: boolean;
  autoHeight?: boolean;
  getRowStyle?: (params: any) => any;
  rowHeight?: number | ((params: any) => number);
  height?: string | number;
  showCheckboxes?: boolean;
  isRowSelectable?: (params: any) => boolean;
}

const AgGridTable: React.FC<AgGridTableProps> = ({
  buttonName = "",
  addButtonLink = "",
  rowData,
  onDelete,
  onEdit,
  columns,
  onSelectionChange,
  loading = false,
  autoHeight = false,
  getRowStyle,
  rowHeight = 60,
  height,
  showCheckboxes = true,
  isRowSelectable,
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

  // IMPORTANT: No flex property for Quotes table
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        // justifyContent: 'center', // ADD THIS
        paddingLeft: '16px'
      },
      headerClass: "ag-left-aligned-header",
      cellClass: "ag-cell-with-border",
    }),
    []
  );

  const defaultColumns: ColDef[] = useMemo(
    () => [
      {
        field: "planName",
        headerName: "Plan Name",
        checkboxSelection: showCheckboxes,
        headerCheckboxSelection: showCheckboxes,
        width: 200,
      },
      { field: "price", headerName: "Price", width: 100 },
      { field: "duration", headerName: "Duration", width: 120 },
      { field: "day", headerName: "Day", width: 80 },
      { field: "month", headerName: "Month", width: 100 },
      { field: "rocket", headerName: "Rocket", width: 200 },
      {
        headerName: "Action",
        width: 140,
        suppressSizeToFit: true,
        pinned: "right",
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
    [onEdit, onDelete, router, showCheckboxes]
  );

  const rowSelection = useMemo<RowSelectionOptions>(
    () => ({
      mode: "multiRow",
      checkboxes: true,
      headerCheckbox: true,
      enableSelectAll: true,
      enableSelectionWithoutKeys: true,
    }),
    []
  );

  const selectionColumnDef = useMemo<ColDef>(() => {
    return {
      width: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      suppressHeaderContextMenu: true,
      pinned: 'left',
      lockPosition: 'left',
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
      headerClass: 'ag-center-aligned-header',
    };
  }, []);

  const onGridReady = useCallback((params: any) => {
    try {
      params.api.sizeColumnsToFit();
    } catch (err) {
      consoleError('AgGrid sizeColumnsToFit failed', err);
    }
  }, []);

  const handleAddClick = useCallback(() => {
    router.push(addButtonLink);
  }, [router, addButtonLink]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 dark:text-gray-200">
        {buttonName && (
          <button onClick={handleAddClick} className="btn-primary" aria-label={`Add ${buttonName}`}>
            + Add {buttonName}
          </button>
        )}
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-xl bg-transparent">
            <PageLoader fullScreen={false} />
          </div>
        )}
        <div className={`${isDark ? 'ag-theme-alpine-dark cute-ag-grid ' : 'ag-theme-alpine '}`}
          style={{ width: "100%", height: autoHeight ? 'auto' : (height || '80vh'), minHeight: autoHeight ? 240 : 'auto' }}>
          <AgGridReact
            headerHeight={48}
            rowHeight={typeof rowHeight === 'function' ? undefined : rowHeight}
            getRowHeight={typeof rowHeight === 'function' ? rowHeight : undefined}
            ref={gridRef}
            domLayout={autoHeight ? 'autoHeight' : undefined}
            onGridReady={onGridReady}
            rowData={rowData}
            columnDefs={columns || defaultColumns}
            defaultColDef={defaultColDef}
            selectionColumnDef={showCheckboxes ? selectionColumnDef : undefined}
            pagination
            paginationPageSize={20}
            rowSelection={showCheckboxes ? rowSelection : undefined}
            onSelectionChanged={() => {
              if (showCheckboxes) {
                const rows = gridRef.current?.api?.getSelectedRows() || [];
                if (typeof onSelectionChange === 'function') {
                  onSelectionChange(rows);
                }
              }
            }}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            columnMenu="new"
            suppressRowClickSelection={true}
            alwaysShowHorizontalScroll={true}
            getRowStyle={getRowStyle}
            overlayNoRowsTemplate="<span></span>"
            isRowSelectable={isRowSelectable}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(AgGridTable);
