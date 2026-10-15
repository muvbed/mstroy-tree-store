import { describe, it, expect, beforeEach } from "vitest";
import { TreeStore } from "@/utils/TreeStore";
import type { Item, ItemId } from "@/types/items";

const items: Item[] = [
  { id: 1, parent: null, label: "Айтем 1" },
  { id: "91064cef", parent: 1, label: "Айтем 2" },
  { id: 3, parent: 1, label: "Айтем 3" },
  { id: 4, parent: "91064cef", label: "Айтем 4" },
  { id: 5, parent: "91064cef", label: "Айтем 5" },
  { id: 6, parent: "91064cef", label: "Айтем 6" },
  { id: 7, parent: 4, label: "Айтем 7" },
  { id: 8, parent: 4, label: "Айтем 8" },
];

const ids = (list: Item[]): ItemId[] => list.map((item) => item.id);

describe("TreeStore", () => {
  let store: TreeStore<Item>;

  beforeEach(() => {
    store = new TreeStore(items);
  });

  it("getAll возвращает все элементы", () => {
    expect(store.getAll()).toEqual(items);
  });

  it("getItem возвращает элемент по id", () => {
    expect(store.getItem(7)).toEqual(items[6]);
    expect(store.getItem("91064cef")).toEqual(items[1]);
    expect(store.getItem(999)).toBeUndefined();
  });

  it("getChildren возвращает прямых детей", () => {
    expect(ids(store.getChildren(4))).toEqual([7, 8]);
    expect(store.getChildren(5)).toEqual([]);
  });

  it("getAllChildren возвращает всех потомков", () => {
    expect(ids(store.getAllChildren("91064cef"))).toEqual([4, 5, 6, 7, 8]);
    expect(store.getAllChildren(8)).toEqual([]);
  });

  it("getAllParents возвращает путь от элемента до корня", () => {
    expect(ids(store.getAllParents(7))).toEqual([7, 4, "91064cef", 1]);
  });

  it("setItems заменяет все данные", () => {
    store.setItems([{ id: 10, parent: null, label: "Новый" }]);

    expect(ids(store.getAll())).toEqual([10]);
    expect(store.getItem(1)).toBeUndefined();
  });

  it("addItem добавляет элемент в дерево", () => {
    store.addItem({ id: 9, parent: 8, label: "Айтем 9" });

    expect(store.getItem(9)).toBeDefined();
    expect(ids(store.getChildren(8))).toEqual([9]);
  });

  it("removeItem удаляет элемент вместе с потомками", () => {
    store.removeItem("91064cef");

    expect(ids(store.getAll())).toEqual([1, 3]);
    expect(ids(store.getChildren(1))).toEqual([3]);
  });

  it("updateItem обновляет элемент и его связь с родителем", () => {
    store.updateItem({ id: 5, parent: 3, label: "Обновлён" });

    expect(store.getItem(5)?.label).toBe("Обновлён");
    expect(ids(store.getChildren("91064cef"))).toEqual([4, 6]);
    expect(ids(store.getChildren(3))).toEqual([5]);
  });
});
