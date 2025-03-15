import mongoose, { Schema, Document } from "mongoose";

export interface IInbox extends Document {
  conversationIds: string[];
  userId: string;
}

const InboxSchema: Schema = new Schema(
  {
    conversationIds: { type: [String], required: true }, // Corrected array type
    userId: { type: String, required: true },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

export default mongoose.models.Inbox ||
  mongoose.model<IInbox>("Inbox", InboxSchema);
