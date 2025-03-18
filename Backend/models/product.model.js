import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  sold: { type: Boolean, default: false },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  images: [{ type: String }],
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
});

export default mongoose.model("Product", productSchema);
