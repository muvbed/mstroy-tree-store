<script setup lang="ts">
import { useItems } from "@/composables/useItems";
import { AgGridVue } from "ag-grid-vue3";
import type { ColDef, GetRowIdFunc, ModelUpdatedEvent } from "ag-grid-community";
import ItemActions, { type ItemActionsParams } from "@/components/ItemActions.vue";
import type { Item } from "@/types/items";

const { tree, items, isLoading, error, addItem, removeItem } = useItems();

const isGroup = (item?: Item) => !!item && tree.value.getChildren(item.id).length > 0;

const actionsParams: ItemActionsParams = {
  onAdd: ({ id }, node) => {
    addItem(id);

    if (node.group) node.setExpanded(true);
  },
  onRemove: ({ id }) => removeItem(id),
};

const columnDefs: ColDef<Item>[] = [
  {
    colId: "rowNumber",
    headerName: "№ п\\п",
    valueGetter: ({ node }) => (node?.rowIndex ?? 0) + 1,
    lockPosition: "left",
    width: 90,
  },
  { headerName: "Наименование", field: "label", flex: 1 },
];

const autoGroupColumnDef: ColDef<Item> = {
  headerName: "Категория",
  valueGetter: ({ data }) => (isGroup(data) ? "Группа" : "Элемент"),
  cellRendererParams: {
    suppressCount: true,
    innerRenderer: ItemActions,
    ...actionsParams,
  },
  flex: 1,
};

const getRowId: GetRowIdFunc<Item> = ({ data }) => String(data.id);
const refreshRowNumbers = ({ api }: ModelUpdatedEvent<Item>) =>
  api.refreshCells({ columns: ["rowNumber"] });
</script>

<template>
  <p v-if="error">{{ error }}</p>
  <div class="history">
    <button title="Назад" :disabled="!tree.canUndo" @click="tree.undo()">←</button>
    <button title="Вперед" :disabled="!tree.canRedo" @click="tree.redo()">→</button>
  </div>
  <ag-grid-vue
    :rowData="items"
    :loading="isLoading"
    :columnDefs="columnDefs"
    :autoGroupColumnDef="autoGroupColumnDef"
    :getRowId="getRowId"
    :groupDefaultExpanded="-1"
    treeData
    treeDataParentIdField="parent"
    style="height: 500px"
    @model-updated="refreshRowNumbers"
  />
</template>

<style scoped>
.history {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

:deep(.item-category) {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

:deep(.item-category button) {
  width: 28px;
  height: 24px;
  padding: 0;
  cursor: pointer;
}
</style>
