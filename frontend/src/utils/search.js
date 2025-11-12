export const normalizeString = (value) => {
  if (value == null) return "";
  return String(value).toLowerCase();
};

export const buildSearchKey = (row, fields) => {
  return fields
    .map((f) => normalizeString(row[f]))
    .filter(Boolean)
    .join(" ");
};


