import { TreeStore } from "./TreeStore";
import type { TreeItem, ItemId } from "../types/items";

interface Change {
  undo(): void;
  redo(): void;
}

export class HistoryTreeStore<T extends TreeItem = TreeItem> extends TreeStore<T> {
  private undoStack: Change[] = [];
  private redoStack: Change[] = [];

  constructor() {
    super();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  override setItems(items: T[]): void {
    super.setItems(items);
    this.undoStack = [];
    this.redoStack = [];
  }

  override addItem(item: T): void {
    super.addItem(item);
    this.record({
      undo: () => super.removeItem(item.id),
      redo: () => super.addItem(item),
    });
  }

  override removeItem(id: ItemId): void {
    const item = this.getItem(id);

    if (!item) return;

    const removed = [item, ...this.getAllChildren(id)];

    super.removeItem(id);
    this.record({
      undo: () => removed.forEach((entry) => super.addItem(entry)),
      redo: () => super.removeItem(id),
    });
  }

  undo(): void {
    this.move(this.undoStack, this.redoStack, "undo");
  }

  redo(): void {
    this.move(this.redoStack, this.undoStack, "redo");
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
