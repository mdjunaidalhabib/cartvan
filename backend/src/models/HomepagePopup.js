import mongoose from "mongoose";

const HomepagePopupSchema = new mongoose.Schema({
  image: { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  enabled: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

const HomepagePopup =
  mongoose.models.HomepagePopup ||
  mongoose.model("HomepagePopup", HomepagePopupSchema);

export default HomepagePopup;
