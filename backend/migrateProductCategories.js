import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// ✅ Product.category (single ref) থেকে Product.categories (array of refs)
// এ migrate করে। Raw driver ব্যবহার করা হয়েছে যাতে Product model deploy হওয়ার
// আগে/পরে যেকোনো সময় নিরাপদে চালানো যায় — Mongoose model নতুন schema
// deploy হওয়ার পর পুরনো `category` field আর চিনবে না।
const DRY_RUN = process.argv.includes("--dry-run");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });
    console.log("✅ DB connected");

    const products = mongoose.connection.collection("products");
    const trash = mongoose.connection.collection("trashes");

    // 1. Live products with the legacy single `category` field
    const filter = { category: { $exists: true, $ne: null } };
    const toMigrate = await products.countDocuments(filter);
    console.log(
      `Found ${toMigrate} product(s) with legacy single 'category' field`,
    );

    if (!DRY_RUN && toMigrate > 0) {
      const result = await products.updateMany(filter, [
        {
          $set: {
            categories: {
              $cond: [
                { $isArray: "$categories" },
                { $setUnion: ["$categories", ["$category"]] },
                ["$category"],
              ],
            },
          },
        },
        { $unset: "category" },
      ]);
      console.log(`Migrated ${result.modifiedCount} product(s)`);
    }

    // 2. Data-integrity check: products with neither field (pre-existing gap,
    // needs a manual fix via admin — not auto-fixable)
    const orphans = await products
      .find({ category: { $exists: false }, categories: { $exists: false } })
      .project({ _id: 1, name: 1 })
      .toArray();
    if (orphans.length) {
      console.warn(
        `⚠️ ${orphans.length} product(s) have NO category at all — fix manually via admin:`,
        orphans.map((p) => p._id),
      );
    }

    // 3. Trashed Product snapshots — a product trashed before this migration
    // but restored after would otherwise fail the new non-empty-array
    // validator, since restoreFromTrashEntry() replays the raw snapshot.
    const trashFilter = {
      collectionName: "Product",
      "data.category": { $exists: true, $ne: null },
    };
    const trashCount = await trash.countDocuments(trashFilter);
    console.log(
      `Found ${trashCount} trashed Product snapshot(s) needing conversion`,
    );

    if (!DRY_RUN && trashCount > 0) {
      const trashResult = await trash.updateMany(trashFilter, [
        {
          $set: {
            "data.categories": {
              $cond: [
                { $isArray: "$data.categories" },
                { $setUnion: ["$data.categories", ["$data.category"]] },
                ["$data.category"],
              ],
            },
          },
        },
        { $unset: "data.category" },
      ]);
      console.log(
        `Migrated ${trashResult.modifiedCount} trashed product snapshot(s)`,
      );
    }

    console.log(
      DRY_RUN
        ? "🟡 Dry run complete — no writes performed."
        : "🟢 Migration complete.",
    );
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
