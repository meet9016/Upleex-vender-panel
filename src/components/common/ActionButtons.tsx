import React from "react";
import { Edit, Trash2 } from "lucide-react";

type ActionButtonsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
};

export default function ActionButtons({
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-2 h-full">
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 group shadow-sm"
          title="Edit"
        >
          <Edit className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-all duration-300 group shadow-sm"
          title="Delete"
        >
          <Trash2 className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
    </div>
  );
}
