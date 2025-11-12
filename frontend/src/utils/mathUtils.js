export const roundTo = (num, places) => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  if (typeof num !== 'number') {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return "-";
    num = parsed;
  }
  return Number(Math.round(num + "e" + places) + "e-" + places);
};

export const roundToWithZero = (num, places) => {
  if (num === null || num === undefined || isNaN(num)) return 0;
  if (typeof num !== 'number') {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return 0;
    num = parsed;
  }
  return Number(Math.round(num + "e" + places) + "e-" + places);
};
