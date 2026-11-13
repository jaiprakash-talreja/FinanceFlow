process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");

let mongo;
const api = request(app);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function register(name, email, password = "Passw0rd!") {
  const res = await api.post("/api/auth/register").send({ name, email, password });
  expect(res.status).toBe(201);
  return { token: res.body.token, user: res.body.user, auth: { Authorization: `Bearer ${res.body.token}` } };
}

describe("Authentication", () => {
  test("register, login, me, logout", async () => {
    const reg = await register("Alice", "alice@test.dev");
    expect(reg.user.password).toBeUndefined();
    expect(reg.user.role).toBe("user");

    const login = await api.post("/api/auth/login").send({ email: "alice@test.dev", password: "Passw0rd!" });
    expect(login.status).toBe(200);
    const auth = { Authorization: `Bearer ${login.body.token}` };

    expect((await api.get("/api/auth/me").set(auth)).body.user.email).toBe("alice@test.dev");
    expect((await api.post("/api/auth/logout").set(auth)).status).toBe(204);
    // Token is invalid after logout
    expect((await api.get("/api/auth/me").set(auth)).status).toBe(401);
  });

  test("rejects bad input and wrong passwords", async () => {
    const bad = await api.post("/api/auth/register").send({ name: "B", email: "nope", password: "short" });
    expect(bad.status).toBe(400);
    expect(bad.body.details.length).toBeGreaterThan(0);

    const dup = await api.post("/api/auth/register").send({ name: "Alice", email: "alice@test.dev", password: "Passw0rd!" });
    expect(dup.status).toBe(409);

    const wrong = await api.post("/api/auth/login").send({ email: "alice@test.dev", password: "WrongPass1" });
    expect(wrong.status).toBe(401);
  });

  test("protected routes need a token", async () => {
    expect((await api.get("/api/transactions")).status).toBe(401);
    expect((await api.get("/api/transactions").set({ Authorization: "Bearer garbage" })).status).toBe(401);
  });

  test("cannot self-register as admin", async () => {
    const res = await api.post("/api/auth/register").send({ name: "Eve", email: "eve@test.dev", password: "Passw0rd!", role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("user");
  });
});

describe("Transactions CRUD, filters and ownership", () => {
  let bob, carol, foodId, salaryId, txId;

  beforeAll(async () => {
    bob = await register("Bob", "bob@test.dev");
    carol = await register("Carol", "carol@test.dev");
    const cats = (await api.get("/api/categories").set(bob.auth)).body;
    foodId = cats.find((c) => c.name === "Food")._id;
    salaryId = cats.find((c) => c.name === "Salary")._id;
  });

  test("create, read, update, delete", async () => {
    const created = await api.post("/api/transactions").set(bob.auth)
      .send({ category: foodId, amount: 250, date: "2026-11-05", note: "Pizza night" });
    expect(created.status).toBe(201);
    expect(created.body.type).toBe("expense");
    expect(created.body.category.name).toBe("Food");
    txId = created.body._id;

    await api.post("/api/transactions").set(bob.auth).send({ category: salaryId, amount: 50000, date: "2026-11-01", note: "Salary" });

    const list = await api.get("/api/transactions?search=pizza").set(bob.auth);
    expect(list.body.total).toBe(1);
    expect((await api.get("/api/transactions?type=income").set(bob.auth)).body.items[0].amount).toBe(50000);

    const upd = await api.put(`/api/transactions/${txId}`).set(bob.auth).send({ amount: 300 });
    expect(upd.status).toBe(200);
    expect(upd.body.amount).toBe(300);

    const summary = await api.get("/api/transactions/summary?month=2026-11").set(bob.auth);
    expect(summary.body).toMatchObject({ income: 50000, expense: 300, balance: 49700 });
    expect(summary.body.monthly).toHaveLength(6);
  });

  test("another user cannot read, edit or delete it (no IDOR)", async () => {
    expect((await api.get(`/api/transactions/${txId}`).set(carol.auth)).status).toBe(404);
    expect((await api.put(`/api/transactions/${txId}`).set(carol.auth).send({ amount: 1 })).status).toBe(404);
    expect((await api.delete(`/api/transactions/${txId}`).set(carol.auth)).status).toBe(404);
    // and cannot use Bob's category
    const res = await api.post("/api/transactions").set(carol.auth).send({ category: foodId, amount: 10, date: "2026-11-02" });
    expect(res.status).toBe(400);
  });

  test("validation errors return 400", async () => {
    const res = await api.post("/api/transactions").set(bob.auth).send({ category: foodId, amount: -5, date: "not-a-date" });
    expect(res.status).toBe(400);
    expect((await api.get("/api/transactions/not-an-id").set(bob.auth)).status).toBe(400);
  });

  test("budget alert notification when exceeded", async () => {
    const b = await api.post("/api/budgets").set(bob.auth).send({ category: foodId, month: "2026-11", limit: 500 });
    expect(b.status).toBe(201);
    await api.post("/api/transactions").set(bob.auth).send({ category: foodId, amount: 400, date: "2026-11-10" });
    const notes = await api.get("/api/notifications").set(bob.auth);
    expect(notes.body.items.some((n) => n.kind === "budget" && /exceeded/i.test(n.title))).toBe(true);

    const budgets = await api.get("/api/budgets?month=2026-11").set(bob.auth);
    expect(budgets.body[0].spent).toBe(700);
  });

  test("delete", async () => {
    expect((await api.delete(`/api/transactions/${txId}`).set(bob.auth)).status).toBe(204);
    expect((await api.get(`/api/transactions/${txId}`).set(bob.auth)).status).toBe(404);
  });
});

describe("Role-based access control", () => {
  let admin, user;

  beforeAll(async () => {
    user = await register("Dan", "dan@test.dev");
    const a = await register("Root", "root@test.dev");
    await User.updateOne({ _id: a.user._id }, { role: "admin" });
    admin = a;
  });

  test("normal user gets 403 on admin routes", async () => {
    expect((await api.get("/api/admin/stats").set(user.auth)).status).toBe(403);
    expect((await api.get("/api/admin/users").set(user.auth)).status).toBe(403);
  });

  test("admin can list users, change roles and deactivate", async () => {
    const stats = await api.get("/api/admin/stats").set(admin.auth);
    expect(stats.status).toBe(200);
    expect(stats.body.users).toBeGreaterThan(1);

    const users = await api.get("/api/admin/users?search=dan").set(admin.auth);
    expect(users.body.items[0].email).toBe("dan@test.dev");

    const deact = await api.patch(`/api/admin/users/${user.user._id}`).set(admin.auth).send({ isActive: false });
    expect(deact.body.isActive).toBe(false);
    // Deactivated user's token stops working
    expect((await api.get("/api/auth/me").set(user.auth)).status).toBe(401);
  });

  test("announcements create notifications for users", async () => {
    const res = await api.post("/api/admin/announcements").set(admin.auth).send({ title: "Maintenance", message: "Back in 10 minutes" });
    expect(res.status).toBe(201);
    expect(res.body.sent).toBeGreaterThan(0);
  });

  test("chat: user writes, admin replies", async () => {
    const u = await register("Erin", "erin@test.dev");
    expect((await api.post("/api/chat/messages").set(u.auth).send({ text: "Help please" })).status).toBe(201);
    const convs = await api.get("/api/chat/conversations").set(admin.auth);
    expect(convs.body.some((c) => c.user.email === "erin@test.dev")).toBe(true);
    const reply = await api.post("/api/chat/messages").set(admin.auth).send({ text: "Sure!", userId: u.user._id });
    expect(reply.status).toBe(201);
    const thread = await api.get("/api/chat/messages").set(u.auth);
    expect(thread.body.map((m) => m.text)).toEqual(["Help please", "Sure!"]);
    expect((await api.get("/api/chat/conversations").set(u.auth)).status).toBe(403);
  });
});

test("unknown route returns 404 JSON", async () => {
  const res = await api.get("/api/does-not-exist");
  expect(res.status).toBe(404);
  expect(res.body.error).toMatch(/not found/i);
});
