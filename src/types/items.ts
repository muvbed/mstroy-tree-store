export type ItemId = number | string;

export const isItemId = (value: unknown): value is ItemId =>
  typeof value === "number" || typeof value === "string";

export interface TreeItem {
  id: ItemId;
  parent: ItemId | null;
}

export interface Item extends TreeItem {
  label: string;
}
