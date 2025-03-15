import mongoose, { Schema, Document } from "mongoose";

export interface IWishlist extends Document {
  user: string;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const WishlistSchema: Schema = new Schema(
  {
    user: { type: String, required: true },
    products: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Wishlist ||
  mongoose.model<IWishlist>("Wishlist", WishlistSchema);
