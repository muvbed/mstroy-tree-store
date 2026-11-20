import { MongoClient } from "mongodb";
import type { Item } from "../src/types/items.ts";

const url = process.env.MONGO_URL;

if (!url) throw new Error("MONGO_URL is not set!");

export const client = new MongoClient(url);
export const db = client.db();

export const connectDb = async () => {
  await client.connect();
  await db.command({ ping: 1 });
  await itemsCollection.createIndex({ id: 1 }, { unique: true });
};

export const itemsCollection = db.collection<Item>("items");
