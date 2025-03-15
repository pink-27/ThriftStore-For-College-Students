import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk authentication

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.method === "PATCH") {
    try {
      const { id } = req.query;
      console.log(id);
      const updatedOrder = await prisma.order.update({
        where: { id: String(id), userId: auth.userId },
        data: { status: "canceled" },
      });
      const orders = await prisma.order.findMany({
        where: { userId: auth.userId }, // ✅ Use "where" to filter by userId
      });

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
      return res.status(500).json({ error: "Failed to cancel order" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
