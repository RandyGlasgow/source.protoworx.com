export const convertToString = (value: any) => {
  if (Array.isArray(value)) {
    return value.map(convertToString).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
};
