import mongoose from "mongoose";

const MONGO_URI = "mongodb://127.0.0.1:27017/myapp";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();
