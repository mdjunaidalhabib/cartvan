import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(mongoUri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    if (err instanceof Error) {
      console.error("🔥 MongoDB Connection Error:", err.message);
      console.error(err);
    } else {
      console.error("🔥 MongoDB Unknown Error:", err);
    }

    process.exit(1);
  }
};

export default connectDB;