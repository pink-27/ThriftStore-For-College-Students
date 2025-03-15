import type { NextApiRequest, NextApiResponse } from "next";
import Inbox from "@/models/Inbox";
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk authentication
import dbConnect from "@/lib/mongo";
import exp from "constants";
export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const auth = getAuth(req);
  await dbConnect();

  const userId = auth.userId;
  if (req.method === "GET") {
    try {
      const inbox = await Inbox.find({ userId: userId });
      console.log(inbox);
      res.status(200).json(inbox);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inbox" });
    }
  }
  if (req.method === "POST") {
    try {
      const { conversationId, recipientId } = req.body;
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
  }
};
export default handler;
