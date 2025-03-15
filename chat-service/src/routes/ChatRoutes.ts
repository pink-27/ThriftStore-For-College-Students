import express, { Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import { getAuth } from "@clerk/express";
import mongoose from "mongoose";
import { Kafka } from "kafkajs";
import Inbox from "../models/Inbox";
import Chat from "../models/Chat";

const kafka = new Kafka({
  clientId: "chat-service",
  brokers: ["kafka:9092"],
});

const kafkaForMongo = new Kafka({
  clientId: "chat-service-mongo",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();
const producerForMongo = kafkaForMongo.producer();

const router = express.Router();

router.get(
  "/:conversationId",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    if (!conversationId || typeof conversationId !== "string") {
      res.status(400).json({ error: "Missing or invalid conversationId" });
      return;
    }

    try {
      const chats = await Chat.find({ conversationId })
        .sort({ timestamp: 1 })
        .lean();
      res.status(200).json({ success: true, chats });
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

router.post("/", async (req: Request, res: Response) => {
  const { conversationId, message, senderId } = req.body;
  if (!conversationId || !message || !senderId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    await producerForMongo.connect();
    await producerForMongo.send({
      topic: "chats-mongo",
      messages: [
        {
          value: JSON.stringify({
            conversationId,
            text: message,
            senderId,
            timestamp: Date.now(),
          }),
        },
      ],
    });

    await producer.connect();
    await producer.send({
      topic: conversationId,
      messages: [
        {
          value: JSON.stringify({
            text: message,
            senderId,
            timestamp: Date.now(),
          }),
        },
      ],
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});
export default router;
