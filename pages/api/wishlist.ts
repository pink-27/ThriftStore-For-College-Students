import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongo";
import Wishlist from "@/models/Wishlist";
import { Ewert } from "next/font/google";
import { Kafka } from "kafkajs";
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk authentication

const kafka = new Kafka({
  clientId: "wishlist-app",
  brokers: ["localhost:9092"], // Kafka in Docker
});

const producer = kafka.producer();

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
      console.log("hello", productId);
      let wishlist = await Wishlist.findOneAndUpdate(
        { user: auth.userId, products: productId }, // Find a wishlist that contains the product
        { $pull: { products: productId } }, // Remove the product from the array
        { new: true } // Return the updated document
      );
      wishlist = await Wishlist.find({ user: auth.userId }).populate(
        "products"
      );
      return res.status(200).json(wishlist[0].products);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update wishlist" });
    }
  }
  if (req.method === "GET") {
    try {
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const wishlist = await Wishlist.findOne({ user: userId }).populate(
        "products"
      );
      console.log(wishlist);
      if (!wishlist) {
        return res.status(200).json([]); // Return an empty array if no wishlist found
      }

      return res.status(200).json(wishlist.products);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
