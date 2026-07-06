import React from "react";
import { Edit, Trash2, Eye } from "lucide-react";

type ActionButtonsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  disableDelete?: boolean;
};

export default function ActionButtons({
  onEdit,
  onDelete,
  onView,
  showEdit = true,
  showDelete = true,
  showView = false,
  disableDelete = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-2 h-full">
      {showView && onView && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-green-500 bg-green-50 hover:bg-green-100 hover:text-green-700 transition-all duration-300 group shadow-sm"
          title="View"
        >
          <Eye className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
      {showEdit && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 group shadow-sm"
          title="Edit"
        >
          <Edit className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disableDelete && onDelete) {
              onDelete();
            }
          }}
          disabled={disableDelete}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300 group shadow-sm ${
            disableDelete
              ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
              : 'text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700'
          }`}
          title={disableDelete ? "Cannot delete approved product" : "Delete"}
        >
          <Trash2 className={`w-[1.05rem] h-[1.05rem] transition-transform duration-300 ${
            disableDelete ? '' : 'group-hover:scale-110'
          }`} />
        </button>
      )}
    </div>
  );
}
