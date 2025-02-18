import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  conversationId: string;
  text: string;
  timestamp: number;
  createdAt: Date;
}

const ChatSchema: Schema = new Schema(
  {
    conversationId: { type: String, required: true }, // Fixed spelling
    text: { type: String, required: true },
    timestamp: { type: Number, required: true }, // Unix timestamp
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

export default mongoose.models.Chat ||
  mongoose.model<IChat>("Chat", ChatSchema);
