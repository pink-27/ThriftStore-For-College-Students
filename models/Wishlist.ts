import mongoose, { Schema, Document } from "mongoose";

export interface IWishlist extends Document {
  //   user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const WishlistSchema: Schema = new Schema(
  {
    // user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: { type: [Schema.Types.ObjectId], ref: "Product", default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Wishlist ||
  mongoose.model<IWishlist>("Wishlist", WishlistSchema);
