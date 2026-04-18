import type { PartsStatistics, AvgTimeInInventory, PricePerCondition } from './interfaces';

export const getPartsStatistics = async (): Promise<PartsStatistics[] | undefined> => {
  return fetch(`http://localhost:5000/api/reports/parts_statistics`).then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  });
};

export const getAvgTimeInInventory = async (): Promise<AvgTimeInInventory[] | undefined> => {
  return fetch(`http://localhost:5000/api/reports/avg_time_inventory`).then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  });
};

export const getPricePerCondition = async (): Promise<PricePerCondition[] | undefined> => {
  return fetch(`http://localhost:5000/api/reports/price_per_condition`).then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  });
};
