import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongo";
import Product from "@/models/Product";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const products = await Product.find({});
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, description, price, sellerId, category } = req.body;

      if (!name || !description || !price || !category || !sellerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newProduct = new Product({
        name,
        description,
        price,
        seller: sellerId, // Ensure consistency
        category,
      });

      await newProduct.save();

      return res.status(201).json({ message: "Product created successfully" });
    } catch (error) {
      console.error("Error saving product:", error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
