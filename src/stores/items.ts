import { reactive, computed, ref } from "vue";
import { v7 as uuidv7 } from "uuid";
import { defineStore } from "pinia";
import { createItems, deleteItem, fetchItems as loadItems } from "@/api/items";
import { HistoryTreeStore } from "@/utils/HistoryTreeStore";
import type { Item, ItemId } from "@/types/items";

export const useItemsStore = defineStore("items", () => {
  let queue: Promise<unknown> = Promise.resolve();
  let version = 0;

  const send = (request: () => Promise<string | null>) => {
    const sentVersion = version;

    queue = queue.then(async () => {
      if (sentVersion !== version) return;

      const message = await request();

      if (!message) return;

      version++;
      await fetchItems();
      error.value ??= `Не удалось сохранить изменения (${message}). Показаны данные с сервера.`;
    });
  };

  const tree = reactive(
    new HistoryTreeStore<Item>({
      onAdd: (added) => send(() => createItems(added)),
      onRemove: (id) => send(() => deleteItem(id)),
    }),
  );

  const items = computed(() => tree.getAll());
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const fetchItems = async (signal?: AbortSignal) => {
    isLoading.value = true;
    error.value = null;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await loadItems(signal);

    if (signal?.aborted) return;

    isLoading.value = false;

    if (result.data) {
      tree.setItems(result.data);
    } else if (result.error) {
      error.value = result.error;
    }
  };

  const addItem = (parent: ItemId) => {
    if (isLoading.value) return;

    const id = uuidv7();

    tree.addItem({ id, parent, label: "Новый элемент" });
  };

  const removeItem = (id: ItemId) => {
    if (isLoading.value) return;

    tree.removeItem(id);
  };

  return { tree, items, isLoading, error, fetchItems, addItem, removeItem };
});
