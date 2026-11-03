<script setup lang="ts">
import type { ICellRendererParams, IRowNode } from "ag-grid-community";
import type { Item } from "@/types/items";

export interface ItemActionsParams {
  onAdd: (item: Item, node: IRowNode<Item>) => void;
  onRemove: (item: Item) => void;
}

const { params } = defineProps<{
  params: ICellRendererParams<Item> & ItemActionsParams;
}>();
</script>

<template>
  <span class="item-category">
    <span>{{ params.value }}</span>
    <template v-if="params.data">
      <button
        title="Добавить дочерний элемент"
        @click="params.onAdd(params.data, params.node)"
      >
        +
      </button>
      <button title="Удалить элемент" @click="params.onRemove(params.data)">✕</button>
    </template>
  </span>
</template>
