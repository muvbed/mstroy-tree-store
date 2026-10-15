import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import ItemsTable from "@/components/ItemsTable.vue";

const items = [
  { id: 1, parent: null, label: "Айтем 1" },
  { id: 2, parent: 1, label: "Айтем 2" },
];

describe("ItemsTable", () => {
  it("показывает загрузку, а через 2 секунды загруженные строки", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => items }),
    );

    const wrapper = mount(ItemsTable, {
      global: { plugins: [createPinia()], stubs: { AgGridVue: true } },
    });
    const grid = wrapper.findComponent({ name: "AgGridVue" });

    expect(grid.props("loading")).toBe(true);
    expect(grid.props("rowData")).toEqual([]);

    await vi.advanceTimersByTimeAsync(2000);

    expect(grid.props("loading")).toBe(false);
    expect(grid.props("rowData")).toEqual(items);

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
