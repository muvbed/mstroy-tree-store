export type ItemId = number | string;

export const isItemId = (value: unknown): value is ItemId =>
  typeof value === "number" || typeof value === "string";

export interface Item {
  id: ItemId;
  parent: ItemId | null;
  label: string;
}
