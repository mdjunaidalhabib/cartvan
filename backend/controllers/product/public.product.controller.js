import Product from "../../src/models/Product.js";
import Category from "../../src/models/Category.js";

export const getProductsPublic = async (req, res) => {
  try {
    const activeCats = await Category.find({ isActive: true })
      .select("_id")
      .lean();
    const products = await Product.find({
      categories: { $in: activeCats.map((c) => c._id) },
      isActive: true,
    })
      .select("-reviews")
      .populate("categories", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductByIdPublic = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categories")
      .lean();
    const hasActiveCategory =
      Array.isArray(product?.categories) &&
      product.categories.some((c) => c && c.isActive);
    if (!product || !product.isActive || !hasActiveCategory) {
      return res.status(403).json({ error: "Product is hidden or inactive" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductsByCategoryPublic = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId).lean();
    if (!category || !category.isActive) {
      return res.status(403).json({ error: "Category hidden or inactive" });
    }

    const products = await Product.find({
      categories: category._id,
      isActive: true,
    })
      .select("-reviews")
      .populate("categories", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};
