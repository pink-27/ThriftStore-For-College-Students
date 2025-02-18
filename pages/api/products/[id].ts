import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongo";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk authentication
import { clerkClient } from "@clerk/nextjs/server";
import Chat from "@/models/Chat";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();
  const { id } = req.query;

  console.log(`Product ID: ${id}`);

  // ✅ Extract user ID from Clerk token
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No valid token" });
  }

  if (req.method === "GET") {
    try {
      const product = await Product.findById(id);
      const clerk = await clerkClient();
      if (!product) return res.status(404).json({ error: "Product not found" });
      const Sellername = await clerk.users.getUser(product.seller);
      return res.status(200).json({ product, Sellername });
    } catch (error) {
      return res.status(500).json({ error: "Error fetching product" });
    }
  }

  if (req.method === "PATCH" || req.method === "DELETE") {
    try {
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // ✅ Authorization check: Only the seller (owner) can modify/delete
      if (product.seller !== userId) {
        return res
          .status(403)
          .json({ error: "Forbidden: You are not the seller" });
      }

      if (req.method === "PATCH") {
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
          new: true,
        });
        const product = await Product.findById(id);
        const clerk = await clerkClient();
        const Sellername = await clerk.users.getUser(product.seller);
        return res.status(200).json({ updatedProduct, Sellername });
      }

      if (req.method === "DELETE") {
        await Product.findByIdAndDelete(id);
        return res.status(200).json({ message: "Product deleted" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Error processing request" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
