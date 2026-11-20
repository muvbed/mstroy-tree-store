// @vitest-environment node
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Item } from "../../src/types/items";

const mongo = await MongoMemoryServer.create();

process.env.MONGO_URL = mongo.getUri("mstroy");

const { app } = await import("../app.ts");
const { client, connectDb, itemsCollection } = await import("../db.ts");

await connectDb();

const items: Item[] = [
  { id: 1, parent: null, label: "Айтем 1" },
  { id: "abc", parent: 1, label: "Айтем 2" },
  { id: 3, parent: "abc", label: "Айтем 3" },
  { id: 4, parent: null, label: "Айтем 4" },
];

beforeEach(async () => {
  await itemsCollection.deleteMany({});
  await itemsCollection.insertMany(items.map((item) => ({ ...item })));
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await client.close();
  await mongo.stop();
});

describe("GET /api/items", () => {
  it("отдаёт элементы без _id", async () => {
    const response = await request(app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(items);
  });

  it("отвечает 500 при ошибке базы", async () => {
    vi.spyOn(itemsCollection, "find").mockImplementation(() => {
      throw new Error("DB is down");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).get("/api/items");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal Server Error" });
  });
});

describe("POST /api/items", () => {
  it("создает элемент", async () => {
    const item: Item = { id: 10, parent: 1, label: "Новый" };

    const response = await request(app).post("/api/items").send([item]);

    expect(response.status).toBe(201);
    expect(await itemsCollection.findOne({ id: 10 }, { projection: { _id: 0 } })).toEqual(
      item,
    );
  });

  it("отвечает 409 на повторный id", async () => {
    const response = await request(app)
      .post("/api/items")
      .send([{ id: 1, parent: null, label: "Дубль" }]);

    expect(response.status).toBe(409);
  });

  it.each([
    { name: "пустой массив", body: [] },
    { name: "нет полей", body: [{ id: 10 }] },
    { name: "не массив", body: { id: 10, parent: 1, label: "x" } },
  ])("отвечает 400: $name", async ({ body }) => {
    const response = await request(app).post("/api/items").send(body);

    expect(response.status).toBe(400);
  });

  it("сохраняет только известные поля", async () => {
    const response = await request(app)
      .post("/api/items")
      .send([{ id: 10, parent: 1, label: "Новый", hack: true }]);

    expect(response.status).toBe(201);
    expect(await itemsCollection.findOne({ id: 10 }, { projection: { _id: 0 } })).toEqual(
      {
        id: 10,
        parent: 1,
        label: "Новый",
      },
    );
  });

  it("отвечает 422, если родителя нет", async () => {
    const response = await request(app)
      .post("/api/items")
      .send([{ id: 10, parent: 999, label: "Сирота" }]);

    expect(response.status).toBe(422);
    expect(await itemsCollection.countDocuments({ id: 10 })).toBe(0);
  });

  it("принимает группу, где родитель в том же запросе", async () => {
    const response = await request(app)
      .post("/api/items")
      .send([
        { id: 10, parent: 1, label: "Группа" },
        { id: 11, parent: 10, label: "Ребенок" },
      ]);

    expect(response.status).toBe(201);
    expect(await itemsCollection.countDocuments({ id: { $in: [10, 11] } })).toBe(2);
  });

  it.each([
    { name: "ссылка на себя", body: [{ id: 10, parent: 10, label: "x" }] },
    {
      name: "цикл из двух",
      body: [
        {
          id: 10,
          parent: 11,
          label: "x",
        },
        {
          id: 11,
          parent: 10,
          label: "y",
        },
      ],
    },
  ])("отвечает 422 на цикл: $name", async ({ body }) => {
    const response = await request(app).post("/api/items").send(body);

    expect(response.status).toBe(422);
    expect(await itemsCollection.countDocuments({ id: { $in: [10, 11] } })).toBe(0);
  });

  it("отвечает 400 на битый JSON", async () => {
    const response = await request(app)
      .post("/api/items")
      .set("Content-Type", "application/json")
      .send("{bad");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("отвечает 413 на слишком большое тело", async () => {
    const response = await request(app)
      .post("/api/items")
      .send([{ id: 100, parent: null, label: "x".repeat(200_000) }]);

    expect(response.status).toBe(413);
  });
});

describe("DELETE /api/items/:id", () => {
  const remainingIds = async () =>
    (await itemsCollection.find().toArray()).map(({ id }) => id);

  it("удаляет элемент вместе со всеми потомками", async () => {
    const response = await request(app).delete("/api/items/1");

    expect(response.status).toBe(204);
    expect(await remainingIds()).toEqual([4]);
  });

  it("находит строковый id", async () => {
    const response = await request(app).delete("/api/items/abc");

    expect(response.status).toBe(204);
    expect(await remainingIds()).toEqual([1, 4]);
  });

  it("отвечает 404, если элемента нет", async () => {
    const response = await request(app).delete("/api/items/999");

    expect(response.status).toBe(404);
  });
});
