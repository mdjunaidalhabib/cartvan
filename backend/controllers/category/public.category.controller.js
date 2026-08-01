import Category from "../../src/models/Category.js";

export const getCategoriesPublic = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();
    res.json(categories);
  } catch (err) {
    console.error("❌ Public getCategories error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCategoryByIdPublic = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();

    if (!category) return res.status(404).json({ error: "Category not found" });

    if (category.isActive === false) {
      return res.status(403).json({ error: "Category is hidden" });
    }

    res.json(category);
  } catch (err) {
    console.error("❌ Public getCategoryById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
