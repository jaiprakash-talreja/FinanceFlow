// One-off migration: replace emoji category icons and notification titles with plain text.
// Safe to run more than once. Usage: node src/migrations/emojiIconsToKeys.js
const mongoose = require("mongoose");
const env = require("../config/env");

// Old emoji icons (written as Unicode escapes) -> new icon keys.
const EMOJI_TO_KEY = {
  "\u{1F354}": "utensils", "\u{1F3E0}": "home", "\u{1F68C}": "bus", "\u{1F6CD}\u{FE0F}": "shopping-bag",
  "\u{1F4A1}": "lightbulb", "\u{1F48A}": "pill", "\u{1F3AC}": "film", "\u{1F4DA}": "book",
  "\u{2708}\u{FE0F}": "plane", "\u{1F381}": "gift", "\u{1F4BC}": "briefcase", "\u{1F4BB}": "laptop",
  "\u{1F4C8}": "trending-up", "\u{1F436}": "paw-print", "\u{2615}": "coffee", "\u{1F3F7}\u{FE0F}": "tag",
};
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;

(async () => {
  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db;

  let icons = 0;
  for (const cat of await db.collection("categories").find({}).toArray()) {
    if (/^[a-z-]+$/.test(cat.icon || "")) continue;
    const key = EMOJI_TO_KEY[cat.icon] || "tag";
    await db.collection("categories").updateOne({ _id: cat._id }, { $set: { icon: key } });
    icons += 1;
  }

  let texts = 0;
  for (const coll of ["notifications", "messages"]) {
    for (const doc of await db.collection(coll).find({}).toArray()) {
      const update = {};
      for (const field of ["title", "message", "text"]) {
        if (typeof doc[field] === "string" && EMOJI.test(doc[field])) {
          update[field] = doc[field].replace(EMOJI, "").replace(/\s{2,}/g, " ").trim();
        }
        EMOJI.lastIndex = 0;
      }
      if (Object.keys(update).length) {
        await db.collection(coll).updateOne({ _id: doc._id }, { $set: update });
        texts += 1;
      }
    }
  }

  console.log(`Converted ${icons} category icons and cleaned ${texts} notifications/messages.`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
