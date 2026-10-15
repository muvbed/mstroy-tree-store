import { ref } from "vue";
import { defineStore } from "pinia";
import { getData } from "@/api/http";
import { validateItems } from "@/utils/validators";
import { type Item } from "@/types/items";

export const useItemsStore = defineStore("items", () => {
  const items = ref<Item[]>([]);
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
      items.value = result.data;
    } else if (result.error) {
      error.value = result.error;
    }
  };

  return { items, isLoading, error, fetchItems };
});
