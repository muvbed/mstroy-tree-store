import { describe, it, expect } from "vitest";
import { TreeStore } from "@/utils/TreeStore";
import type { TreeItem } from "@/types/items";

const COUNT = 100_000;
const LIMIT_MS = 200;

const chain: TreeItem[] = Array.from({ length: COUNT }, (_, i) => ({
  id: i,
  parent: i === 0 ? null : i - 1,
}));

const measure = (fn: () => void): number => {
  const start = performance.now();
  fn();
  return performance.now() - start;
};

describe(`TreeStore: производительность на ${COUNT} элементах`, () => {
  it("setItems", () => {
    const store = new TreeStore();

    expect(measure(() => store.setItems(chain))).toBeLessThan(LIMIT_MS);
  });

  it(`getItem и getChildren: ${COUNT} вызовов`, () => {
    const store = new TreeStore(chain);

    const time = measure(() => {
      for (let i = 0; i < COUNT; i++) {
        store.getItem(i);
        store.getChildren(i);
      }
    });

    expect(time).toBeLessThan(LIMIT_MS);
  });

  it("getAllChildren от корня", () => {
    const store = new TreeStore(chain);

    expect(measure(() => store.getAllChildren(0))).toBeLessThan(LIMIT_MS);
  });

  it("getAllParents от самого глубокого элемента", () => {
    const store = new TreeStore(chain);

    expect(measure(() => store.getAllParents(COUNT - 1))).toBeLessThan(LIMIT_MS);
  });

  it("removeItem корня со всеми потомками", () => {
    const store = new TreeStore(chain);

    expect(measure(() => store.removeItem(0))).toBeLessThan(LIMIT_MS);
  });
});
