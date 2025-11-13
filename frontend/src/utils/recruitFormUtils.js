export const formatPhoneNumber = (value) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

export const handleNumberInput = (value, isDecimal = false) => {
  if (value === '') return '';
  const regex = isDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
  if (regex.test(value)) {
    return value;
  }
  return null;
};

export const getGradeName = (grade) => {
  const gradeMap = {
    20: 'Poor',
    30: 'Well Below Avg',
    40: 'Below Avg',
    45: 'Fringe-average',
    50: 'Avg',
    55: 'Fringe-plus',
    60: 'Above Avg',
    70: 'Plus',
    80: 'Plus Plus'
  };
  return gradeMap[grade] || '';
};

