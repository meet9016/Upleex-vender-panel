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
import { ColumnMenuModule, ContextMenuModule, RowGroupingModule, TreeDataModule } from "ag-grid-enterprise";
import PageLoader from "@/components/common/PageLoader";

ModuleRegistry.registerModules([
  AllCommunityModule,
  ColumnMenuModule,
  ContextMenuModule,
  RowGroupingModule,
  TreeDataModule
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
  onSelectionChange?: (rows: any[]) => void;
  loading?: boolean;
  autoHeight?: boolean;
  getRowStyle?: (params: any) => any;
  rowHeight?: number | ((params: any) => number);
  height?: string | number;
  showCheckboxes?: boolean;
  isRowSelectable?: (params: any) => boolean;
  treeData?: boolean;
  getDataPath?: (data: any) => string[];
  autoGroupColumnDef?: ColDef;
  groupDefaultExpanded?: number;
  getRowId?: (params: any) => string;
  noRowsMessage?: string;
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
  treeData,
  getDataPath,
  autoGroupColumnDef,
  groupDefaultExpanded,
  getRowId,
  noRowsMessage,
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
      groupSelects: treeData ? 'descendants' : 'self',
    }),
    [treeData]
  );

  const selectionColumnDef = useMemo<ColDef>(() => {
    return {
      width: 60,
      maxWidth: 60,
      minWidth: 60,
      suppressHeaderMenuButton: true,
      suppressHeaderContextMenu: true,
      pinned: 'left',
      lockPosition: 'left',
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' },
      headerClass: 'ag-center-aligned-header',
    };
  }, []);

  useEffect(() => {
    if (gridRef.current?.api) {
      if (loading) {
        gridRef.current.api.hideOverlay();
      } else if (!rowData || rowData.length === 0) {
        gridRef.current.api.showNoRowsOverlay();
      } else {
        gridRef.current.api.hideOverlay();
      }
    }
  }, [loading, rowData]);

  const onGridReady = useCallback((params: any) => {
    try {
      params.api.sizeColumnsToFit();
      if (loading) {
        params.api.hideOverlay();
      }
    } catch (err) {
      consoleError('AgGrid sizeColumnsToFit failed', err);
    }
  }, [loading]);

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
                let rows = gridRef.current?.api?.getSelectedRows() || [];
                
                // Filter out rows that are not selectable based on isRowSelectable
                if (isRowSelectable) {
                  rows = rows.filter((row: any) => {
                    return isRowSelectable({ data: row });
                  });
                  
                  // Deselect the unselectable rows that were auto-selected
                  const allSelectedNodes = gridRef.current?.api?.getSelectedNodes() || [];
                  allSelectedNodes.forEach((node: any) => {
                    if (!isRowSelectable({ data: node.data })) {
                      node.setSelected(false);
                    }
                  });
                  
                  // Re-fetch the filtered rows after deselecting
                  rows = gridRef.current?.api?.getSelectedRows() || [];
                }
                
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
            suppressNoRowsOverlay={loading}
            overlayNoRowsTemplate={!loading && noRowsMessage ? `<span class="text-gray-500 dark:text-gray-400 font-medium">${noRowsMessage}</span>` : "<span></span>"}
            isRowSelectable={isRowSelectable}
            treeData={treeData}
            getDataPath={getDataPath}
            autoGroupColumnDef={autoGroupColumnDef}
            groupDefaultExpanded={groupDefaultExpanded}
            groupSelectsChildren={true}
            getRowId={getRowId}
            animateRows={true}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(AgGridTable);
