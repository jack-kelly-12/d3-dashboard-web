export const roundTo = (num, places) => {
  if (isNaN(num)) return "-";
  return Number(Math.round(num + "e" + places) + "e-" + places);
};
