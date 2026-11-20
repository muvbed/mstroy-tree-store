import { TreeStore } from "./TreeStore";
import type { TreeItem, ItemId } from "../types/items";

interface Change {
  undo(): void;
  redo(): void;
}

export interface HistoryListener<T> {
  onAdd(items: T[]): void;
  onRemove(id: ItemId): void;
}

export class HistoryTreeStore<T extends TreeItem = TreeItem> extends TreeStore<T> {
  private undoStack: Change[] = [];
  private redoStack: Change[] = [];

  constructor(private readonly listener?: HistoryListener<T>) {
    super();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  override setItems(items: T[]): void {
    super.setItems([]);
    items.forEach((item) => super.addItem(item));
    this.undoStack = [];
    this.redoStack = [];
  }

  override addItem(item: T): void {
    this.add([item]);
    this.record({
      undo: () => this.remove(item.id),
      redo: () => this.add([item]),
    });
  }

  override removeItem(id: ItemId): void {
    const item = this.getItem(id);

    if (!item) return;

    const removed = [item, ...this.getAllChildren(id)];

    this.remove(id);
    this.record({
      undo: () => this.add(removed),
      redo: () => this.remove(id),
    });
  }

  undo(): void {
    this.move(this.undoStack, this.redoStack, "undo");
  }

  redo(): void {
    this.move(this.redoStack, this.undoStack, "redo");
  }

  private add(items: T[]): void {
    items.forEach((item) => super.addItem(item));
    this.listener?.onAdd(items);
  }

  private remove(id: ItemId): void {
    super.removeItem(id);
    this.listener?.onRemove(id);
  }

  private record(change: Change): void {
    this.undoStack.push(change);
    this.redoStack.splice(0);
  }

  private move(from: Change[], to: Change[], action: keyof Change): void {
    const change = from.pop();

    if (change) {
      change[action]();
      to.push(change);
    }
  }
}
