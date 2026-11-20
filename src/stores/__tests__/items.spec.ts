import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useItemsStore } from "@/stores/items";
import type { Item, ItemId } from "@/types/items";

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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
    store.isLoading = false;
  });

  it("addItem добавляет дочерний элемент с UUIDv7", () => {
    store.addItem(3);

    expect(store.tree.getChildren(3)).toEqual([
      { id: expect.stringMatching(UUID_V7), parent: 3, label: "Новый элемент" },
    ]);
  });

  it("addItem выдаёт каждому элементу свой id", () => {
    store.addItem(1);
    store.addItem(1);

    expect(new Set(ids(store.items)).size).toBe(items.length + 2);
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
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(items) }),
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

  it("при ошибке сохранения отбрасывает очередь и перезагружает данные", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        init?.method === "POST"
          ? { ok: false, status: 500 }
          : { ok: true, json: () => Promise.resolve(items) },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    store.addItem(3);
    store.addItem(1);

    await vi.advanceTimersByTimeAsync(2000);
    await vi.waitFor(() =>
      expect(store.error).toContain(
        "Не удалось сохранить изменения (Ошибка HTTP 500). Показаны данные с сервера.",
      ),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(ids(store.items)).toEqual(ids(items));

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("не меняет таблицу во время загрузки", () => {
    store.isLoading = true;

    store.addItem(1);
    store.removeItem(3);

    expect(ids(store.items)).toEqual(ids(items));
  });
});
