import { getData, sendData } from "@/api/http";
import { validateItems } from "@/utils/validators";
import type { Item, ItemId } from "@/types/items";

export const fetchItems = (signal?: AbortSignal) =>
  getData("/api/items", validateItems, signal);

export const createItems = (items: Item[]) =>
  sendData("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
  });

export const deleteItem = (id: ItemId) =>
  sendData(`/api/items/${encodeURIComponent(id)}`, { method: "DELETE" });
