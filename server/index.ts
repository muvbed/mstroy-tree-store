import { app } from "./app.ts";
import { connectDb } from "./db.ts";

await connectDb();
console.log("MongoDB connected");

const port = 3001;

app.listen(port, "127.0.0.1", () => {
  console.log(`Server: http://127.0.0.1:${port}`);
});
