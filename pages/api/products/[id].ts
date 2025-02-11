import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongo";
import Product from "@/models/Product";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  const { id } = req.query;
  console.log(id);

  if (req.method === "GET") {
    try {
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      return res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ error: "Error fetching product" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedProduct)
        return res.status(404).json({ error: "Product not found" });
      return res.status(200).json(updatedProduct);
    } catch (error) {
      return res.status(500).json({ error: "Error updating product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await Product.findByIdAndDelete(id);
      return res.status(200).json({ message: "Product deleted" });
    } catch (error) {
      return res.status(500).json({ error: "Error deleting product" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
