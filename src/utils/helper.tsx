interface MonthItem {
  month: string;       // stored as string in your form (e.g., "1", "2")
  price: string;
  cancelPrice: string;
}

interface FormDataType {
  months: MonthItem[];
}

export const getAvailableMonths = (
  currentIndex: number,
  months: MonthItem[]
): number[] => {
  const selectedMonths = months
    .filter((_, i) => i !== currentIndex)
    .map((m) => Number(m.month))
    .filter((m) => !isNaN(m));

  return Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (month) => !selectedMonths.includes(month)
  );
};


