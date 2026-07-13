import dotenv from "dotenv";
import mongoose from "mongoose";
import Counter from "./src/models/Counter.js";

dotenv.config();

// ✅ পরের নতুন order-এর orderNumber হবে START_SEQ + 1
// (Counter এর seq এমনভাবে কাজ করে — $inc হওয়ার পরের ভ্যালুটাই ব্যবহৃত হয়)
const START_SEQ = 0;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ DB connected");

    const updated = await Counter.findOneAndUpdate(
      { name: "orderNumber" },
      { $set: { seq: START_SEQ } },
      { new: true, upsert: true },
    );

    console.log(
      `✅ orderNumber counter reset. Next order will get orderNumber = ${
        updated.seq + 1
      }`,
    );
  } catch (err) {
    console.error("❌ Reset failed:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
