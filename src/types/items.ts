export type ItemId = number | string;

export interface TreeItem {
  id: ItemId;
  parent: ItemId | null;
}

export interface Item extends TreeItem {
  label: string;
}
