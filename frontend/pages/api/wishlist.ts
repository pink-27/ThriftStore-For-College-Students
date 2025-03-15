import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongo";
import Wishlist from "@/models/Wishlist";
import { Ewert } from "next/font/google";
import { getAuth } from "@clerk/nextjs/server"; // Clerk Auth

import { Kafka } from "kafkajs";
import mongoose from "mongoose";
import { clerkClient } from "@clerk/nextjs/server";

const kafka = new Kafka({
  clientId: "wishlist-app",
  brokers: ["localhost:9092"], // Kafka in Docker
});

const producer = kafka.producer();
const clerk = clerkClient();
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = getAuth(req);

  //   console.log(req);
  await dbConnect();
  if (req.method === "POST") {
    try {
      const { user, product } = req.body;

      if (!user || !product) {
        return res.status(400).json({ error: "Missing user or product" });
      }

      const wishlist = await Wishlist.findOneAndUpdate(
        { user }, // ✅ Search by user field
        { $addToSet: { products: product } }, // ✅ Add product to wishlist
        { upsert: true, new: true }
      );

      await producer.connect();
      await producer.send({
        topic: "wishlist-events",
        messages: [
          { value: JSON.stringify({ user, product, event: "added" }) },
        ],
      });
      await producer.disconnect();

      return res.status(200).json(wishlist.products);
    } catch (error) {
      console.error("Wishlist update error:", error);
      return res.status(500).json({ error: "Failed to update wishlist" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // const { user,product } = req.body;
      const { productId } = req.body;
      const auth = getAuth(req);
      const token = await auth.getToken();
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
        "http://localhost:5010/api/products/bulk",
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

      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update wishlist" });
    }
  }
  if (req.method === "GET") {
    try {
      const userId = req.query.userId;
      const auth = getAuth(req);
      const token = await auth.getToken();
      if (!token) {
        res.status(401).json({ error: "Unauthorized: No valid token" });
        return;
      }
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Fetch wishlist from MongoDB (Contains product ObjectIds)
      const wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
        return res.status(200).json([]); // No wishlist, return empty array
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
        "http://localhost:5010/api/products/bulk",
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

      return res.status(200).json(products);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
