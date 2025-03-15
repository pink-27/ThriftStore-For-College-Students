import express from "express";
import orderRoutes from "./routes/OrderRoute"; // Import your order routes
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app = express();
const PORT = 5014;
app.use(cors());
app.use(clerkMiddleware()); // Ensure this is applied before routes
app.use(express.json()); // Middleware to parse JSON requests
app.use("/api/orders", orderRoutes); // Use the order routes

app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
});
