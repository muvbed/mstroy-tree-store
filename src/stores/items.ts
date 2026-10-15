import { reactive, computed, ref } from "vue";
import { defineStore } from "pinia";
import { getData } from "@/api/http";
import { validateItems } from "@/utils/validators";
import { TreeStore } from "@/utils/TreeStore";
import type { Item } from "@/types/items";

export const useItemsStore = defineStore("items", () => {
  const tree = reactive(new TreeStore<Item>([]));
  const items = computed(() => tree.getAll());
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const fetchItems = async (signal?: AbortSignal) => {
    isLoading.value = true;
    error.value = null;

    await new Promise((resolve) => setTimeout(() => resolve(null), 2000));

    const result = await getData("/items.json", validateItems, signal);

    if (signal?.aborted) return;

    isLoading.value = false;

    if (result.data) {
      tree.setItems(result.data);
    } else if (result.error) {
      error.value = result.error;
    }
  };

  return { tree, items, isLoading, error, fetchItems };
});
