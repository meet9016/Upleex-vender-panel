import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SelectionState {
  selectedIds: Record<string, boolean>;
}

const initialState: SelectionState = {
  selectedIds: {},
};

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    setSelection: (state, action: PayloadAction<{ id: string; selected: boolean }>) => {
      state.selectedIds[action.payload.id] = action.payload.selected;
    },
    setMultipleSelections: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.selectedIds = { ...state.selectedIds, ...action.payload };
    },
    replaceSelections: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.selectedIds = action.payload;
    },
    clearSelections: (state) => {
      state.selectedIds = {};
    },
  },
});

export const { setSelection, setMultipleSelections, replaceSelections, clearSelections } = selectionSlice.actions;
export default selectionSlice.reducer;
