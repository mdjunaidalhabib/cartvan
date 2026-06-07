import mongoose from "mongoose";

const FloatingActionButtonSchema = new mongoose.Schema({
  phone: { type: String, default: "" },
  whatsapp: { type: String, default: "" },
  messenger: { type: String, default: "" }, 
  enabled: { type: Boolean, default: true }, 
  updatedAt: { type: Date, default: Date.now },
});

const FloatingActionButton =
  mongoose.models.FloatingActionButton ||
  mongoose.model("FloatingActionButton", FloatingActionButtonSchema);

export default FloatingActionButton;
