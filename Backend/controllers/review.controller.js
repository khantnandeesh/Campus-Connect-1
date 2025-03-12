import Product from "../models/product.model.js";

// Get reviews for a product
export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate("reviews.user", "username");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product.reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a review (with rating)
export const addReview = async (req, res) => {
  const { rating, text } = req.body;  // Now we expect both rating and text
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if the user has already reviewed the product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );
    if (alreadyReviewed) return res.status(400).json({ message: "You have already reviewed this product" });

    // Create new review
    const review = { user: userId, rating, text };
    product.reviews.push(review);

    // Recalculate average rating
    product.averageRating =
      product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;

    await product.save();

    // Return the newly added review (optionally populate the user field)
    const populatedReview = await product.populate("reviews.user", "username");
    const addedReview = populatedReview.reviews[populatedReview.reviews.length - 1];

    res.status(201).json(addedReview);
  } catch (error) {
    res.status(500).json({ message: "Error adding review", error });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviewIndex = product.reviews.findIndex((r) => r._id.toString() === reviewId);
    if (reviewIndex === -1) return res.status(404).json({ message: "Review not found" });

    // Ensure the review belongs to the logged-in user
    if (product.reviews[reviewIndex].user.toString() !== userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    product.reviews.splice(reviewIndex, 1);

    // Recalculate average rating
    if (product.reviews.length > 0) {
      product.averageRating =
        product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;
    } else {
      product.averageRating = 0;
    }

    await product.save();
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
