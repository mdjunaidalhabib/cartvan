import Product from "../../src/models/Product.js";
import { toNumber } from "../../utils/product/index.js";
import { normalizeReviews } from "../../utils/product/index.js";

export const addReviewToProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("categories");

    const hasActiveCategory =
      Array.isArray(product?.categories) &&
      product.categories.some((c) => c && c.isActive);
    if (!product || !product.isActive || !hasActiveCategory) {
      return res.status(403).json({ error: "Product is hidden or inactive" });
    }

    const { rating, comment } = req.body;

    if (rating === undefined || !comment) {
      return res.status(400).json({ error: "Rating & comment required" });
    }

    const cleanRating = toNumber(rating, 0);
    if (cleanRating < 1 || cleanRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const u = req.user;

    product.reviews.unshift({
      userId: u?._id || null,
      user: u?.name || "User",
      avatar: u?.avatar || "",
      rating: cleanRating,
      comment: String(comment).trim(),
    });

    const total = product.reviews.reduce(
      (sum, r) => sum + toNumber(r.rating, 0),
      0
    );

    product.rating = product.reviews.length
      ? Math.round((total / product.reviews.length) * 10) / 10
      : 0;

    await product.save();

    return res.status(200).json({
      message: "✅ Review added successfully",
      reviews: normalizeReviews(product.reviews),
      rating: product.rating,
    });
  } catch (err) {
    console.error("Add Review Error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const updateProductReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(id).populate("categories");

    const hasActiveCategory =
      Array.isArray(product?.categories) &&
      product.categories.some((c) => c && c.isActive);
    if (!product || !product.isActive || !hasActiveCategory) {
      return res.status(403).json({ error: "Product is hidden or inactive" });
    }

    const review = product.reviews.id(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (!review.userId || String(review.userId) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ error: "You can only edit your own review" });
    }

    if (rating !== undefined) {
      const cleanRating = toNumber(rating, review.rating);
      if (cleanRating < 1 || cleanRating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }
      review.rating = cleanRating;
    }

    if (comment !== undefined) {
      review.comment = String(comment).trim();
    }

    const total = product.reviews.reduce(
      (sum, r) => sum + toNumber(r.rating, 0),
      0
    );

    product.rating = product.reviews.length
      ? Math.round((total / product.reviews.length) * 10) / 10
      : 0;

    await product.save();

    return res.status(200).json({
      message: "✅ Review updated successfully",
      reviews: normalizeReviews(product.reviews),
      rating: product.rating,
    });
  } catch (err) {
    console.error("Update Review Error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const deleteProductReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    const product = await Product.findById(id).populate("categories");

    const hasActiveCategory =
      Array.isArray(product?.categories) &&
      product.categories.some((c) => c && c.isActive);
    if (!product || !product.isActive || !hasActiveCategory) {
      return res.status(403).json({ error: "Product is hidden or inactive" });
    }

    const review = product.reviews.id(reviewId);
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (!review.userId || String(review.userId) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ error: "You can only delete your own review" });
    }

    review.deleteOne();

    const total = product.reviews.reduce(
      (sum, r) => sum + toNumber(r.rating, 0),
      0
    );

    product.rating = product.reviews.length
      ? Math.round((total / product.reviews.length) * 10) / 10
      : 0;

    await product.save();

    return res.status(200).json({
      message: "🗑️ Review deleted successfully",
      reviews: normalizeReviews(product.reviews),
      rating: product.rating,
    });
  } catch (err) {
    console.error("Delete Review Error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
};
