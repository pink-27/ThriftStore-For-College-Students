import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: string;
  //   seller: mongoose.Types.ObjectId;
  category: string;
  //   images: string[];
  //   available: boolean;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true, min: 0 },
    // seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    // images: { type: [String], default: [] },
    // available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);
