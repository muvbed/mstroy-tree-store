import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useItemsStore } from "@/stores/items";
import type { Item, ItemId } from "@/types/items";

const items: Item[] = [
  { id: 1, parent: null, label: "Айтем 1" },
  { id: "91064cef", parent: 1, label: "Айтем 2" },
  { id: 3, parent: 1, label: "Айтем 3" },
  { id: 4, parent: "91064cef", label: "Айтем 4" },
];

const ids = (list: Item[]): ItemId[] => list.map((item) => item.id);

describe("items store", () => {
  let store: ReturnType<typeof useItemsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useItemsStore();
    store.tree.setItems(items);
  });

  it("addItem добавляет дочерний элемент со следующим числовым id", () => {
    store.addItem(3);

    expect(store.tree.getItem(5)).toEqual({ id: 5, parent: 3, label: "Айтем 5" });
    expect(ids(store.tree.getChildren(3))).toEqual([5]);
  });

  it("addItem пропускает id, занятый строкой с тем же значением", () => {
    store.tree.addItem({ id: "5", parent: 1, label: "Строковый id" });

    store.addItem(1);

    expect(store.tree.getItem(6)?.parent).toBe(1);
  });

  it("addItem в пустом дереве начинает с 1", () => {
    store.tree.setItems([]);

    store.addItem(1);

    expect(ids(store.items)).toEqual([1]);
  });

  it("removeItem удаляет элемент вместе с потомками", () => {
    store.removeItem("91064cef");

    expect(ids(store.items)).toEqual([1, 3]);
    expect(ids(store.tree.getChildren(1))).toEqual([3]);
  });

  it("история очищается после загрузки данных", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => items }),
    );

    store.addItem(3);
    store.tree.undo();

    const loading = store.fetchItems();

    await vi.advanceTimersByTimeAsync(2000);
    await loading;

    expect(store.tree.canUndo).toBe(false);
    expect(store.tree.canRedo).toBe(false);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
