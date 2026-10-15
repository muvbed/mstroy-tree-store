import { type Item, isItemId } from "@/types/items";

export const validateItems = (data: unknown): data is Item[] => {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item &&
        isItemId(item.id) &&
        (item.parent === null || isItemId(item.parent)) &&
        typeof item.label === "string",
    )
  );
};
