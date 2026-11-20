import express from "express";
import type { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { itemsCollection } from "./db.ts";
import { validateItems } from "../src/utils/validators.ts";
import type { Item, ItemId } from "../src/types/items.ts";

export const app = express();

app.use(express.json());

app.get("/api/items", async (_req, res) => {
  const items = await itemsCollection.find({}, { projection: { _id: 0 } }).toArray();

  res.json(items);
});

const hasCycle = (items: Item[]) => {
  const parentById = new Map(items.map(({ id, parent }) => [id, parent]));

  return items.some(({ id }) => {
    let current = parentById.get(id);

    for (let steps = 0; current !== undefined && current !== null; steps++) {
      if (steps >= items.length) return true;

      current = parentById.get(current);
    }

    return false;
  });
};

app.post("/api/items", async (req, res) => {
  if (!validateItems(req.body) || req.body.length === 0) {
    res.status(400).json({ error: "Invalid items" });

    return;
  }

  const items = req.body.map(({ id, parent, label }) => ({ id, parent, label }));

  if (hasCycle(items)) {
    res.status(422).json({ error: "Cycle in parents" });

    return;
  }

  const ids = new Set(items.map(({ id }) => id));
  const parents = new Set(
    items.flatMap(({ parent }) => (parent === null || ids.has(parent) ? [] : [parent])),
  );
  const found = await itemsCollection.countDocuments({ id: { $in: [...parents] } });

  if (found < parents.size) {
    res.status(422).json({ error: "Parent not found" });

    return;
  }

  await itemsCollection.insertMany(items);
  res.sendStatus(201);
});

const parseId = (value: string): ItemId => (/^\d+$/.test(value) ? Number(value) : value);

app.delete("/api/items/:id", async (req, res) => {
  const id = parseId(req.params.id);

  const [item] = await itemsCollection
    .aggregate<{ descendants: Item[] }>([
      { $match: { id } },
      {
        $graphLookup: {
          from: itemsCollection.collectionName,
          startWith: "$id",
          connectFromField: "id",
          connectToField: "parent",
          as: "descendants",
        },
      },
    ])
    .toArray();

  if (!item) {
    res.status(404).json({ error: "Item not found" });

    return;
  }

  const ids = [id, ...item.descendants.map((child) => child.id)];

  await itemsCollection.deleteMany({ id: { $in: ids } });
  res.sendStatus(204);
});

const isClientError = (err: unknown): err is Error & { status: number } =>
  err instanceof Error &&
  "status" in err &&
  typeof err.status === "number" &&
  err.status >= 400 &&
  err.status < 500;

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({ error: "Item already exists" });

    return;
  }

  if (isClientError(err)) {
    res.status(err.status).json({ error: err.message });

    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});
