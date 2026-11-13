// Local development without installing MongoDB or creating an Atlas account:
// starts an in-memory MongoDB, seeds demo data, then starts the API.
// Usage: npm run dev:memory     (data is lost when the process stops)
const { MongoMemoryServer } = require("mongodb-memory-server");
const { execFileSync } = require("child_process");
const path = require("path");

(async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("financeflow");
  process.env.JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret-not-for-production";
  console.log(`In-memory MongoDB at ${process.env.MONGODB_URI}`);
  execFileSync(process.execPath, [path.join(__dirname, "seed.js")], { stdio: "inherit", env: process.env });
  require("./server");
})();
