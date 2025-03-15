import express, { Request, Response } from "express";
import Wishlist from "../models/Wishlist";
import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import { getAuth } from "@clerk/express";
import mongoose from "mongoose";
import { Kafka } from "kafkajs";

const router = express.Router();
const kafka = new Kafka({
  clientId: "wishlist-app",
  brokers: ["kafka:9092"], // Kafka in Docker
});

const producer = kafka.producer();
router.get("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;
    const token = req.headers.authorization?.split(" ")[1];
    console.log(token, userId);
    if (!token) {
      res.status(401).json({ error: "Unauthorized: No valid token" });
      return;
    }
    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Fetch wishlist from MongoDB (Contains product ObjectIds)
    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      res.status(200).json([]); // No wishlist, return empty array
      return;
    }

    console.log(wishlist);

    // Extract product IDs from wishlist
    const productIds: string[] = wishlist.products.map(
      (productId: mongoose.Types.ObjectId) => productId.toString()
    );
    console.log(productIds);

    if (productIds.length === 0) {
      res.status(200).json([]);
      return;
    }
    // Fetch product details from the Express microservice
    const productDetails = await fetch(
      "http://product-service:5010/api/products/bulk",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      }
    );
    console.log(token);
    // console.log(productDetails);

    if (!productDetails.ok) {
      throw new Error("Failed to fetch products from microservice");
    }

    const products = await productDetails.json();

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.delete("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    // const { user,product } = req.body;
    const { productId } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;
    const token = req.headers.authorization?.split(" ")[1];

    console.log("hello", productId);
    let wishlist = await Wishlist.findOneAndUpdate(
      { user: auth.userId, products: productId }, // Find a wishlist that contains the product
      { $pull: { products: productId } }, // Remove the product from the array
      { new: true } // Return the updated document
    );
    wishlist = await Wishlist.findOne({ user: auth.userId });
    const productIds: string[] = wishlist.products.map(
      (productId: mongoose.Types.ObjectId) => productId.toString()
    );
    console.log(productIds);

    if (productIds.length === 0) {
      res.status(200).json([]);
      return;
    }
    // Fetch product details from the Express microservice
    const productDetails = await fetch(
      "http://product-service:5010/api/products/bulk",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      }
    );
    console.log(token);
    // console.log(productDetails);

    if (!productDetails.ok) {
      throw new Error("Failed to fetch products from microservice");
    }

    const products = await productDetails.json();

    res.status(200).json(products);

    // return res.status(200).json(wishlist[0].products);
  } catch (error) {
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});

router.post("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { user, product } = req.body;

    if (!user || !product) {
      res.status(400).json({ error: "Missing user or product" });
      return;
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user }, // ✅ Search by user field
      { $addToSet: { products: product } }, // ✅ Add product to wishlist
      { upsert: true, new: true }
    );

    await producer.connect();
    await producer.send({
      topic: "wishlist-events",
      messages: [{ value: JSON.stringify({ user, product, event: "added" }) }],
    });
    await producer.disconnect();

    res.status(200).json(wishlist.products);
  } catch (error) {
    console.error("Wishlist update error:", error);
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});
export default router;
