import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createPinia } from "pinia";
import { AllCommunityModule, ModuleRegistry, type GridApi } from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";
import ItemsTable from "@/components/ItemsTable.vue";
import type { Item } from "@/types/items";

const items: Item[] = [
  { id: 1, parent: null, label: "Айтем 1" },
  { id: "91064cef", parent: 1, label: "Айтем 2" },
  { id: 3, parent: 1, label: "Айтем 3" },
  { id: 4, parent: "91064cef", label: "Айтем 4" },
];

const ADD = "Добавить дочерний элемент";
const REMOVE = "Удалить элемент";

const sizes = {
  clientWidth: 1000,
  offsetWidth: 1000,
  clientHeight: 500,
  offsetHeight: 500,
};

let api: GridApi<Item>;

const categoryCell = (rowId: string) =>
  document.querySelector(`[row-id="${rowId}"] [col-id="ag-Grid-AutoColumn"]`);

const category = (rowId: string) =>
  categoryCell(rowId)?.querySelector(".item-category > span")?.textContent;

const click = async (rowId: string, label: string) => {
  const button = categoryCell(rowId)?.querySelector<HTMLButtonElement>(
    `[title="${label}"]`,
  );

  expect(button, `кнопка «${label}» в строке ${rowId}`).toBeTruthy();
  button!.click();
  await vi.advanceTimersByTimeAsync(100);
};

const history = (label: "Назад" | "Вперед") =>
  document.querySelector<HTMLButtonElement>(`.history [title="${label}"]`)!;

const clickHistory = async (label: "Назад" | "Вперед") => {
  history(label).click();
  await vi.advanceTimersByTimeAsync(100);
};

const collapse = async (rowId: string) => {
  api.getRowNode(rowId)!.setExpanded(false);
  await vi.advanceTimersByTimeAsync(100);
};

describe("ItemsTable с AG Grid", () => {
  let wrapper: VueWrapper;

  const originals = new Map<string, PropertyDescriptor | undefined>();

  beforeAll(() => {
    ModuleRegistry.registerModules([AllCommunityModule, TreeDataModule]);

    const proto = HTMLElement.prototype;

    for (const [prop, value] of Object.entries(sizes)) {
      originals.set(prop, Object.getOwnPropertyDescriptor(proto, prop));
      Object.defineProperty(proto, prop, { configurable: true, get: () => value });
    }
  });

  afterAll(() => {
    for (const [prop, descriptor] of originals) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
      else Reflect.deleteProperty(HTMLElement.prototype, prop);
    }
  });

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => items }),
    );

    wrapper = mount(ItemsTable, {
      global: { plugins: [createPinia()] },
      attachTo: document.body,
    });
    await vi.advanceTimersByTimeAsync(2100);

    const grid = wrapper.findComponent({ name: "AgGridVue" });

    api = (grid.vm as unknown as { api: GridApi<Item> }).api;
  });

  afterEach(() => {
    wrapper.unmount();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("«+» в элементе добавляет дочернюю строку и делает его группой", async () => {
    expect(category("3")).toBe("Элемент");

    await click("3", ADD);

    const added = api.getRowNode("5");

    expect(added?.data).toEqual({ id: 5, parent: 3, label: "Айтем 5" });
    expect(added?.parent?.id).toBe("3");
    expect(added?.displayed).toBe(true);
    expect(api.getRowNode("3")?.expanded).toBe(true);
    expect(category("3")).toBe("Группа");
  });

  it("«+» в свёрнутой группе раскрывает её, чтобы новая строка была видна", async () => {
    await collapse("91064cef");
    await click("91064cef", ADD);

    expect(api.getRowNode("91064cef")?.expanded).toBe(true);
    expect(api.getRowNode("5")?.displayed).toBe(true);
  });

  it("«✕» удаляет строку вместе с потомками", async () => {
    await click("91064cef", REMOVE);

    expect(api.getRowNode("91064cef")).toBeUndefined();
    expect(api.getRowNode("4")).toBeUndefined();
    expect(api.getDisplayedRowCount()).toBe(2);
  });

  it("после удаления последнего ребёнка группа снова становится элементом", async () => {
    await click("4", REMOVE);

    expect(category("91064cef")).toBe("Элемент");
  });

  it("кнопки истории выключены, пока нечего отменять и повторять", async () => {
    expect(history("Назад").disabled).toBe(true);
    expect(history("Вперед").disabled).toBe(true);

    await click("3", ADD);

    expect(history("Назад").disabled).toBe(false);
    expect(history("Вперед").disabled).toBe(true);

    await clickHistory("Назад");

    expect(history("Назад").disabled).toBe(true);
    expect(history("Вперед").disabled).toBe(false);
  });

  it("«Назад» и «Вперед» не сбрасывают раскрытие других строк", async () => {
    await collapse("91064cef");
    await click("3", ADD);
    await clickHistory("Назад");

    expect(api.getRowNode("5")).toBeUndefined();
    expect(api.getRowNode("91064cef")?.expanded).toBe(false);
    expect(api.getRowNode("1")?.expanded).toBe(true);

    await clickHistory("Вперед");

    expect(api.getRowNode("5")?.displayed).toBe(true);
    expect(api.getRowNode("91064cef")?.expanded).toBe(false);
    expect(api.getRowNode("1")?.expanded).toBe(true);
  });

  it("«Назад» после удаления группы возвращает её вместе с потомками", async () => {
    await click("91064cef", REMOVE);
    await clickHistory("Назад");

    expect(api.getRowNode("4")?.parent?.id).toBe("91064cef");
    expect(api.getRowNode("4")?.displayed).toBe(true);
    expect(category("91064cef")).toBe("Группа");
  });
});
