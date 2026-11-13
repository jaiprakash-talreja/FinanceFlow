// Seeds an admin, two demo users and ~4 months of sample transactions.
// Usage: npm run seed   (WARNING: wipes existing data in the database)
const mongoose = require("mongoose");
const env = require("./config/env");
const User = require("./models/User");
const Category = require("./models/Category");
const Transaction = require("./models/Transaction");
const Budget = require("./models/Budget");
const Notification = require("./models/Notification");
const Message = require("./models/Message");

const ACCOUNTS = [
  { name: "Admin", email: "admin@financeflow.dev", password: "Admin@1234", role: "admin" },
  { name: "Demo User", email: "demo@financeflow.dev", password: "Demo@1234", role: "user" },
  { name: "Riya Sharma", email: "riya@financeflow.dev", password: "Riya@1234", role: "user" },
];

const NOTES = {
  Food: ["Swiggy order", "Groceries - DMart", "Cafe with friends", "Zomato dinner", "Vegetables"],
  Rent: ["Monthly rent"],
  Transport: ["Metro card recharge", "Uber to college", "Petrol", "Auto fare"],
  Shopping: ["Amazon - headphones", "Myntra - shoes", "Books"],
  Bills: ["Electricity bill", "Mobile recharge", "Wi-Fi bill"],
  Health: ["Pharmacy", "Gym membership"],
  Entertainment: ["Movie tickets", "Spotify", "Netflix"],
};

const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedUser(user, scale) {
  const cats = await Category.insertMany(Category.DEFAULTS.map((c) => ({ ...c, user: user._id })));
  const by = Object.fromEntries(cats.map((c) => [c.name, c]));
  const now = new Date();
  const txs = [];

  for (let back = 3; back >= 0; back--) {
    const y = now.getFullYear();
    const m = now.getMonth() - back;
    const maxDay = back === 0 ? now.getDate() : 28;
    const at = (d) => new Date(y, m, Math.min(d, maxDay), 12);

    txs.push({ category: by.Salary._id, type: "income", amount: 45000 * scale, date: at(1), note: "Monthly salary", paymentMethod: "bank" });
    if (Math.random() > 0.4) txs.push({ category: by.Freelance._id, type: "income", amount: rand(4000, 12000), date: at(rand(10, 25)), note: "Freelance project", paymentMethod: "bank" });
    txs.push({ category: by.Rent._id, type: "expense", amount: 12000 * scale, date: at(3), note: "Monthly rent", paymentMethod: "bank" });

    for (let i = 0; i < 14; i++) {
      const name = pick(["Food", "Food", "Food", "Transport", "Transport", "Shopping", "Bills", "Health", "Entertainment"]);
      const range = { Food: [150, 1200], Transport: [60, 900], Shopping: [500, 4000], Bills: [300, 2200], Health: [200, 1800], Entertainment: [150, 900] }[name];
      txs.push({ category: by[name]._id, type: "expense", amount: rand(...range), date: at(rand(1, 28)), note: pick(NOTES[name]), paymentMethod: pick(["upi", "upi", "card", "cash"]) });
    }
  }
  await Transaction.insertMany(txs.map((t) => ({ ...t, user: user._id })));

  const month = now.toISOString().slice(0, 7);
  await Budget.insertMany([
    { user: user._id, category: by.Food._id, month, limit: 6000 },
    { user: user._id, category: by.Shopping._id, month, limit: 5000 },
    { user: user._id, category: by.Transport._id, month, limit: 3000 },
  ]);
  await Notification.create({ user: user._id, kind: "system", title: "Welcome to FinanceFlow", message: "Track expenses, set budgets and chat with support any time." });
  return txs.length;
}

(async () => {
  await mongoose.connect(env.mongoUri);
  await Promise.all([User, Category, Transaction, Budget, Notification, Message].map((M) => M.deleteMany({})));
  await Promise.all([User, Category, Transaction, Budget, Notification, Message].map((M) => M.syncIndexes()));

  for (const acc of ACCOUNTS) {
    const user = await User.create(acc);
    const n = acc.role === "user" ? await seedUser(user, acc.name === "Demo User" ? 1 : 1.3) : 0;
    console.log(`  ${acc.role.padEnd(5)} ${acc.email.padEnd(24)} ${acc.password}  (${n} transactions)`);
  }

  const demo = await User.findOne({ email: "demo@financeflow.dev" });
  const admin = await User.findOne({ email: "admin@financeflow.dev" });
  await Message.create([
    { conversation: demo._id, sender: demo._id, text: "Hi! How do I set a monthly budget?", fromAdmin: false },
    { conversation: demo._id, sender: admin._id, text: "Open Budgets, click 'New budget', pick a category and a limit. You'll get a live alert at 80% and 100%.", fromAdmin: true },
  ]);

  console.log("Seed complete.");
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
