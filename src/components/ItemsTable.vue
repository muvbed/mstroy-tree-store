<script setup lang="ts">
import { useItems } from "@/composables/useItems";
import { AgGridVue } from "ag-grid-vue3";
import type { ColDef, GetRowIdFunc, ModelUpdatedEvent } from "ag-grid-community";
import type { Item } from "@/types/items";

const { tree, items, isLoading, error } = useItems();

const isGroup = (item?: Item) => !!item && tree.value.getChildren(item.id).length > 0;

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
  cellRendererParams: { suppressCount: true },
  flex: 1,
};

const getRowId: GetRowIdFunc<Item> = ({ data }) => String(data.id);
const refreshRowNumbers = ({ api }: ModelUpdatedEvent<Item>) =>
  api.refreshCells({ columns: ["rowNumber"] });
</script>

<template>
  <p v-if="error">{{ error }}</p>
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
