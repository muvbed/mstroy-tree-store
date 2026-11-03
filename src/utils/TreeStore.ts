import type { TreeItem, ItemId } from "../types/items";

export class TreeStore<T extends TreeItem = TreeItem> {
  private itemsById = new Map<ItemId, T>();
  private childrenById = new Map<ItemId, Set<T>>();

  constructor(items: T[] = []) {
    this.setItems(items);
  }

  getAll(): T[] {
    return Array.from(this.itemsById.values());
  }

  getItem(id: ItemId): T | undefined {
    return this.itemsById.get(id);
  }

  getChildren(id: ItemId): T[] {
    return Array.from(this.childrenById.get(id) ?? []);
  }

  getAllChildren(id: ItemId): T[] {
    const result = this.getChildren(id);

    for (let i = 0; i < result.length; i++) {
      for (const child of this.childrenById.get(result[i]!.id) ?? []) {
        result.push(child);
      }
    }

    return result;
  }

  getAllParents(id: ItemId): T[] {
    const result: T[] = [];
    let item = this.itemsById.get(id);

    while (item) {
      result.push(item);
      item = item.parent === null ? undefined : this.itemsById.get(item.parent);
    }

    return result;
  }

  setItems(items: T[]): void {
    this.itemsById.clear();
    this.childrenById.clear();

    for (const item of items) {
      this.addItem(item);
    }
  }

  addItem(item: T): void {
    const prev = this.itemsById.get(item.id);

    if (prev) this.unlinkFromParent(prev);

    this.itemsById.set(item.id, item);

    if (item.parent === null) return;

    const siblings = this.childrenById.get(item.parent) ?? new Set<T>();

    this.childrenById.set(item.parent, siblings.add(item));
  }

  removeItem(id: ItemId): void {
    const item = this.itemsById.get(id);

    if (!item) return;

    this.unlinkFromParent(item);

    for (const removed of [item, ...this.getAllChildren(id)]) {
      this.itemsById.delete(removed.id);
      this.childrenById.delete(removed.id);
    }
  }

  updateItem(item: T): void {
    if (this.itemsById.has(item.id)) this.addItem(item);
  }

  private unlinkFromParent(item: T): void {
    if (item.parent !== null) this.childrenById.get(item.parent)?.delete(item);
  }
}
