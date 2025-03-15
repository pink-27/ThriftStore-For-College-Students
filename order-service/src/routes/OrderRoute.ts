import express, { Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import { getAuth } from "@clerk/express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();

async function sendOrderNotification(order: any) {
  await producer.connect();
  await producer.send({
    topic: "order-events",
    messages: [
      {
        value: JSON.stringify(order),
      },
    ],
  });
  await producer.disconnect();
}

router.get("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Fetch all orders from PostgreSQL
    const orders = await prisma.order.findMany({
      where: { userId: auth.userId },
    });

    if (orders.length === 0) {
      res.status(200).json([]);
      return;
    }

    // Extract product IDs from orders
    const productIds: string[] = orders.map(
      (order: { productId: any }) => order.productId
    );
    const token = await auth.getToken();
    // Call Product Service API to fetch product details
    const productResponse = await fetch(
      "http://product-service:5010/api/products/bulk",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds }),
      }
    );

    if (!productResponse.ok) {
      throw new Error(
        `Failed to fetch products: ${productResponse.statusText}`
      );
    }

    const products = await productResponse.json();

    // Attach product details to orders
    const enrichedOrders = orders.map((order: { productId: string }) => ({
      ...order,
      product: products.find(
        (product: { _id: string }) => product._id === order.productId
      ),
    }));

    res.status(200).json(enrichedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch orders with product details" });
  }
});

router.post("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }

    const order = await prisma.order.create({
      data: {
        productId,
        userId: auth.userId,
      },
    });
    await sendOrderNotification(order);

    console.log(order);
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.patch("/:id", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const auth = getAuth(req);

    if (!auth?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Update order status
    await prisma.order.update({
      where: { id: String(id), userId: auth.userId },
      data: { status: "canceled" },
    });

    // Fetch all orders of the user
    const orders = await prisma.order.findMany({
      where: { userId: auth.userId },
    });

    // Extract product IDs from orders
    const productIds: string[] = orders.map(
      (order: { productId: any }) => order.productId
    );
    const token = await auth.getToken();

    // Call Product Service API to fetch product details
    const productResponse = await fetch(
      "http://product-service:5010/api/products/bulk",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds }),
      }
    );

    if (!productResponse.ok) {
      throw new Error(
        `Failed to fetch products: ${productResponse.statusText}`
      );
    }

    const products = await productResponse.json();

    // Attach product details to orders
    const enrichedOrders = orders.map((order: { productId: string }) => ({
      ...order,
      product: products.find(
        (product: { _id: string }) => product._id === order.productId
      ),
    }));

    res.status(200).json(enrichedOrders);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to cancel order and fetch products" });
  }
});
export default router;
