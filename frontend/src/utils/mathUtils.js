export const roundTo = (num, places) =>
  Number(Math.round(num + "e" + places) + "e-" + places);
