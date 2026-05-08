import { isEqual } from "lodash";

export const updateDataCleaner = <T extends Record<string, any>>(
  newData: Partial<T>,
  oldData: T,
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(newData).filter(([key, value]) => {
      const field = key as keyof T;

      // remove undefined / null
      if (value === undefined || value === null) return false;

      // remove empty string
      if (typeof value === "string" && value.trim() === "") return false;

      // remove NaN
      if (typeof value === "number" && isNaN(value)) return false;

      // remove unchanged values
      if (isEqual(value, oldData[field])) return false;

      return true;
    }),
  ) as Partial<T>;
};
