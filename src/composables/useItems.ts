import { onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useItemsStore } from "@/stores/items";

export const useItems = () => {
  const controller = new AbortController();
  const store = useItemsStore();

  onMounted(() => store.fetchItems(controller.signal));
  onUnmounted(() => controller.abort());

  return {
    ...storeToRefs(store),
    addItem: store.addItem,
    removeItem: store.removeItem,
  };
};
