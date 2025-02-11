import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongo";
import Wishlist from "@/models/Wishlist";
import { Ewert } from "next/font/google";
import Product from "@/models/Product";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "wishlist-app",
  brokers: ["localhost:9092"], // Kafka in Docker
});

const producer = kafka.producer();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  //   console.log(req);
  await dbConnect();
  if (req.method === "POST") {
    try {
      // const { user,product } = req.body;
      //   console.log(req.body);
      const { product } = req.body;

      const wishlist = await Wishlist.findOneAndUpdate(
        {},
        { $addToSet: { products: product } },
        { upsert: true, new: true }
      );
      // console.log(wishlist.products);
      await producer.connect();
      await producer.send({
        topic: "wishlist-events",
        messages: [{ value: JSON.stringify({ product, event: "added" }) }],
      });
      await producer.disconnect();

      return res.status(200).json(wishlist.products);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update wishlist" });
    }
  }
  if (req.method === "DELETE") {
    try {
      // const { user,product } = req.body;
      const { productId } = req.body;
      console.log("hello", productId);
      let wishlist = await Wishlist.findOneAndUpdate(
        { products: productId }, // Find a wishlist that contains the product
        { $pull: { products: productId } }, // Remove the product from the array
        { new: true } // Return the updated document
      );
      wishlist = await Wishlist.find({}).populate("products");
      return res.status(200).json(wishlist[0].products);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update wishlist" });
    }
  }
  if (req.method === "GET") {
    try {
      // const { user,product } = req.body;
      const { product } = req.body;
      const wishlist = await Wishlist.find({}).populate("products");
      console.log(wishlist);

      return res.status(200).json(wishlist[0].products);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update wishlist" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
