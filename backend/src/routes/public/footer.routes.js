import express from "express";
import Footer from "../../models/Footer.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const footer = await Footer.findOne();
    if (!footer) return res.json({});

    const footerObj = footer.toObject();

    // ✅ DB তে 'socials' হিসেবে save আছে, frontend চায় 'socialLinks'
    footerObj.socialLinks = (footerObj.socials || []).map((s) => ({
      platform: s.platform,
      url: s.url,
    }));
    delete footerObj.socials;

    res.json(footerObj);
  } catch (err) {
    console.error("❌ Error fetching footer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
