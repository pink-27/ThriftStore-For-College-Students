// pages/api/chat/send.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Kafka } from "kafkajs";
import Chat from "@/models/Chat";

const kafka = new Kafka({
  clientId: "chat-service",
  brokers: ["localhost:9092"],
});

const kafkaForMongo = new Kafka({
  clientId: "chat-service-mongo",
  brokers: ["localhost:9092"],
});
const producer = kafka.producer();
const producerForMongo = kafkaForMongo.producer();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { conversationId } = req.query;
    if (!conversationId || typeof conversationId !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid conversationId" });
    }

    try {
      const chats = await Chat.find({ conversationId })
        .sort({ timestamp: 1 })
        .lean();
      return res.status(200).json({ success: true, chats });
    } catch (error) {
      console.error("Error fetching chats:", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Expected body: { conversationId: string, message: string, senderId: string }
  const { conversationId, message, senderId } = req.body;
  if (!conversationId || !message || !senderId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await producerForMongo.connect();
    const msg = message;
    await producerForMongo.send({
      topic: "chats-mongo", // e.g. "buyerId_sellerId"
      messages: [
        {
          value: JSON.stringify({
            conversationId,
            msg,
            senderId,
            timestamp: Date.now(),
          }),
        },
      ],
    });
    // await producerForMongo.disconnect();
    await producer.connect();
    await producer.send({
      topic: conversationId, // e.g. "buyerId_sellerId"
      messages: [
        { value: JSON.stringify({ message, senderId, timestamp: Date.now() }) },
      ],
    });
    // await producer.disconnect();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
