import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import Product from "../../../models/Product"; // Import your MongoDB Product model
import dbConnect from "@/lib/mongo";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { productId } = req.body;
      const quantity = 1;
      const order = await prisma.order.create({
        data: {
          productId,
          quantity,
        },
      });

      return res.status(201).json(order);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create order" });
    }
  }
  if (req.method === "GET") {
    try {
      await dbConnect();
      // Fetch all orders from PostgreSQL
      const orders = await prisma.order.findMany();

      // Extract product IDs from orders
      const productIds = orders.map((order) => order.productId);

      // Fetch product details from MongoDB
      const products = await Product.find({ _id: { $in: productIds } });

      // Attach product details to orders
      const enrichedOrders = orders.map((order) => ({
        ...order,
        product: products.find(
          (product) => product._id.toString() === order.productId.toString()
        ),
      }));

      return res.status(200).json(enrichedOrders);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Failed to fetch orders with product details" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
