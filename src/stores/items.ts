import { reactive, computed, ref } from "vue";
import { defineStore } from "pinia";
import { getData } from "@/api/http";
import { validateItems } from "@/utils/validators";
import { HistoryTreeStore } from "@/utils/HistoryTreeStore";
import type { Item, ItemId } from "@/types/items";

export const useItemsStore = defineStore("items", () => {
  const tree = reactive(new HistoryTreeStore<Item>());
  const items = computed(() => tree.getAll());
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const fetchItems = async (signal?: AbortSignal) => {
    isLoading.value = true;
    error.value = null;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await getData("/items.json", validateItems, signal);

    if (signal?.aborted) return;

    isLoading.value = false;

    if (result.data) {
      tree.setItems(result.data);
    } else if (result.error) {
      error.value = result.error;
    }
  };

  const nextId = () =>
    items.value.reduce((max, { id }) => Math.max(max, Number(id) || 0), 0) + 1;

  const addItem = (parent: ItemId) => {
    const id = nextId();

    tree.addItem({ id, parent, label: `Айтем ${id}` });
  };

  const removeItem = (id: ItemId) => tree.removeItem(id);

  return { tree, items, isLoading, error, fetchItems, addItem, removeItem };
});
