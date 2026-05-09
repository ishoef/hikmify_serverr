import { isEqual } from "lodash";
export const updateDataCleaner = (newData, oldData) => {
    return Object.fromEntries(Object.entries(newData).filter(([key, value]) => {
        const field = key;
        // remove undefined / null
        if (value === undefined || value === null)
            return false;
        // remove empty string
        if (typeof value === "string" && value.trim() === "")
            return false;
        // remove NaN
        if (typeof value === "number" && isNaN(value))
            return false;
        // remove unchanged values
        if (isEqual(value, oldData[field]))
            return false;
        return true;
    }));
};
//# sourceMappingURL=updateDataCleaner.js.map