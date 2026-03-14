import React from "react";
import { MdModeEdit, MdDelete } from "react-icons/md";

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
          className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white transition"
          title="Edit"
        >
          <MdModeEdit className="text-base" />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#E55353] text-[#E55353] hover:bg-[#E55353] hover:text-white transition"
          title="Delete"
        >
          <MdDelete className="text-base" />
        </button>
      )}
    </div>
  );
}
