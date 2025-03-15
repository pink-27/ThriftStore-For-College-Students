import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import Product from "../../../models/Product"; // Import your MongoDB Product model
import dbConnect from "@/lib/mongo";
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk authentication

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = getAuth(req);

  console.log(auth, req.body);
  if (!auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method === "POST") {
    try {
      const { productId } = req.body;
      const order = await prisma.order.create({
        data: {
          productId: productId,
          userId: auth.userId,
        },
      });
      console.log(order);

      return res.status(201).json(order);
    } catch (error) {
      // console.error(typeEr);
      return res.status(500).json({ error: "Failed to create order" });
    }
  }
  if (req.method === "GET") {
    try {
      await dbConnect();
      // Fetch all orders from PostgreSQL
      const orders = await prisma.order.findMany({
        where: { userId: auth.userId },
      });
      // Extract product IDs from orders
      console.log(orders, auth.userId);
      const productIds = orders.map((order) => order.productId);

      // Fetch product details from MongoDB
      const products = await Product.find({ _id: { $in: productIds } });

      // Attach product details to orders
      const enrichedOrders = orders
        .map((order) => ({
          ...order,
          product: products.find(
            (product) => product._id.toString() === order.productId.toString()
          ),
        }))
        .filter((order) => order.product); // Remove orders where product is not found

      // console.log("hello", enrichedOrders);

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
