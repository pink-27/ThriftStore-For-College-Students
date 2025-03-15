import express, { Application } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import productRoutes from "./routes/ProductRoutes";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Use routes correctly
app.use("/api/products", productRoutes);
app.use(clerkMiddleware()); // Ensure this is applied before routes

// MongoDB Connection
const mongoUri = process.env.DATABASE_URL as string;

const connectWithRetry = async () => {
  let retries = 10; // Number of retries
  while (retries) {
    try {
      await mongoose.connect(mongoUri);
      console.log("✅ MongoDB Connected");
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection failed: ${err}`);
      retries -= 1;
      console.log(`🔄 Retrying connection (${retries} retries left)...`);
      await new Promise((res) => setTimeout(res, 500)); // Wait 5 seconds before retrying
    }
  }
  console.error("🚨 Could not connect to MongoDB after multiple retries.");
  process.exit(1); // Exit if connection fails after retries
};

connectWithRetry();

// Start the server
const PORT = process.env.PORT || 5010;
app.listen(PORT, () =>
  console.log(`🚀 Product Service running on port ${PORT}`)
);
