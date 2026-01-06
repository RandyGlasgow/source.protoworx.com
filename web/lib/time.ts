type TimeUnit = 'ms' | 's' | 'm' | 'h';
type TimeoutType = `${number}${TimeUnit}`;

const contains = (timeout: TimeoutType, unit: TimeUnit) => {
  return timeout.endsWith(unit);
};

export const getTimeout = (timeout: TimeoutType) => {
  const value = parseInt(timeout.slice(0, -1));
  if (isNaN(value)) {
    throw new Error(`Invalid timeout: ${timeout}`);
  }
  switch (true) {
    case contains(timeout, 'ms'):
      return value * 1;
    case contains(timeout, 's'):
      return value * 1000;
    case contains(timeout, 'm'):
      return value * 60000;
    case contains(timeout, 'h'):
      return value * 3600000;
    default:
      throw new Error(`Invalid timeout: ${timeout}`);
  }
};
