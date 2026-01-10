export const getAvailableMonths = (currentIndex, formData) => {
  // Already selected months except current row
  const selectedMonths = formData?.months
    ?.filter((_, i) => i !== currentIndex)
    ?.map((m) => Number(m.month));

  return Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (month) => !selectedMonths?.includes(month)
  );
};