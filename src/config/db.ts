import mongoose from "mongoose";
import { mustGetEnv } from "../utils/env";

export async function connectDB(): Promise<void> {
  const uri = mustGetEnv("MONGO_URI");
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}