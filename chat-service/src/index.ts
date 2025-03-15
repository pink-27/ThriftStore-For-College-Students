import express, { Application } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import chatRoutes from "./routes/ChatRoutes";
import inboxRoutes from "./routes/InboxRoutes";

dotenv.config();

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Change this to match your Next.js frontend
    credentials: true, // Allow cookies & Authorization headers
  })
);
app.use(express.json());
app.use(clerkMiddleware()); // Ensure authentication middleware is applied before routes

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

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/inbox", inboxRoutes);

// Start the server
const PORT = process.env.PORT || 5012;
app.listen(PORT, () => console.log(`🚀 Chat Service running on port ${PORT}`));
