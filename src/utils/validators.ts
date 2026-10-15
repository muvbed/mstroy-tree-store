import type { Item, ItemId } from "@/types/items";

export const isItemId = (value: unknown): value is ItemId =>
  typeof value === "number" || typeof value === "string";

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
