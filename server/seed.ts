import { readFile } from "node:fs/promises";
import { client, itemsCollection } from "./db.ts";
import type { Item } from "../src/types/items.ts";

const items: Item[] = JSON.parse(await readFile("public/items.json", "utf-8"));

await itemsCollection.deleteMany({});

const { insertedCount } = await itemsCollection.insertMany(items);

console.log(`Inserted ${insertedCount}`);

await client.close();
