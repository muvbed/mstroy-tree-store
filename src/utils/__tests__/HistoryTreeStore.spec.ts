import { describe, it, expect, beforeEach } from "vitest";
import { computed, reactive } from "vue";
import { HistoryTreeStore } from "@/utils/HistoryTreeStore";
import { TreeStore } from "@/utils/TreeStore";
import type { Item, ItemId } from "@/types/items";

const items: Item[] = [
  { id: 1, parent: null, label: "Айтем 1" },
  { id: "91064cef", parent: 1, label: "Айтем 2" },
  { id: 3, parent: 1, label: "Айтем 3" },
  { id: 4, parent: "91064cef", label: "Айтем 4" },
  { id: 7, parent: 4, label: "Айтем 7" },
];

const item: Item = { id: 9, parent: 3, label: "Айтем 9" };

const ids = (list: Item[]): ItemId[] => list.map((entry) => entry.id);

describe("HistoryTreeStore", () => {
  let store: HistoryTreeStore<Item>;

  beforeEach(() => {
    store = new HistoryTreeStore();
    store.setItems(items);
  });

  it("наследуется от TreeStore, загрузка не попадает в историю", () => {
    expect(store).toBeInstanceOf(TreeStore);
    expect(store.getAll()).toEqual(items);
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);
  });

  it("undo и redo отменяют и повторяют добавление", () => {
    store.addItem(item);
    store.undo();

    expect(store.getItem(9)).toBeUndefined();
    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(true);

    store.redo();

    expect(store.getItem(9)).toEqual(item);
    expect(store.canUndo).toBe(true);
    expect(store.canRedo).toBe(false);
  });

  it("undo удаления восстанавливает поддерево, redo удаляет его снова", () => {
    store.removeItem("91064cef");
    store.undo();

    expect(store.getAll()).toHaveLength(items.length);
    expect(ids(store.getAllParents(7))).toEqual([7, 4, "91064cef", 1]);

    store.redo();

    expect(ids(store.getAll())).toEqual([1, 3]);
  });

  it("новое изменение очищает стек повтора", () => {
    store.addItem(item);
    store.undo();
    store.removeItem(3);

    expect(store.canRedo).toBe(false);
  });

  it("setItems очищает историю", () => {
    store.addItem(item);
    store.removeItem(3);
    store.undo();
    store.setItems(items);

    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);
  });

  it("изменения через reactive-обёртку обновляют зависимые вычисления", () => {
    const tree = reactive(new HistoryTreeStore<Item>());
    const count = computed(() => tree.getAll().length);
    const canUndo = computed(() => tree.canUndo);

    tree.setItems(items);
    tree.addItem(item);

    expect(count.value).toBe(items.length + 1);
    expect(canUndo.value).toBe(true);

    tree.undo();
    expect(count.value).toBe(items.length);

    tree.removeItem("91064cef");
    expect(count.value).toBe(2);

    tree.undo();
    expect(count.value).toBe(items.length);
    expect(canUndo.value).toBe(false);
  });
});
