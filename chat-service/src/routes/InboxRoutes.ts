import express, { Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import { getAuth } from "@clerk/express";
import mongoose from "mongoose";
import { Kafka } from "kafkajs";
import Inbox from "../models/Inbox";

const router = express.Router();

router.get("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;
    const inbox = await Inbox.find({ userId: userId });
    console.log(inbox);
    res.status(200).json(inbox);
  } catch (error) {
    console.error("Error fetching inbox:", error);
    res.status(500).json({ error: "Failed to fetch inbox" });
  }
});
router.post("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { conversationId, recipientId } = req.body;
    const auth = getAuth(req);
    const userId = auth.userId;
    const i = await Inbox.findOneAndUpdate(
      { userId: userId },
      { $addToSet: { conversationIds: conversationId } },
      { upsert: true, new: true }
    );
    const inbox = await Inbox.findOneAndUpdate(
      { userId: recipientId },
      { $addToSet: { conversationIds: conversationId } },
      { upsert: true, new: true }
    );
    res.status(200).json(inbox);
  } catch (error) {
    res.status(500).json({ error: "Failed to update inbox" });
  }
});
export default router;
