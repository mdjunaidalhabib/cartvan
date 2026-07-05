import express from "express";

import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import orderRoutes from "./order.routes.js";
import navbarRoutes from "./navbar.routes.js";
import footerRoutes from "./footer.routes.js";
import receiptRoutes from "./receipt.routes.js";
import sliderRoutes from "./slider.routes.js";
import invoiceRoute from "./invoice.js";
import deliveryCharge from "./deliveryCharge.js";
import profileUploadRoutes from "./profileUpload.routes.js";
import userRoutes from "./user.routes.js";
import visitRoutes from "./analytics.js";
import FloatingActionButton from "./FloatingActionButton.route.js";
import homeBadgeRoutes from "./homeBadge.js";
import facebookGroupRoutes from "./facebookGroup.routes.js";
import aboutRoutes from "./about.routes.js";



const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/navbar", navbarRoutes);
router.use("/footer", footerRoutes);
router.use("/receipts", receiptRoutes);
router.use("/slider-images", sliderRoutes);
router.use("/api", invoiceRoute);
router.use("/deliveryCharge", deliveryCharge);
router.use("/profile", profileUploadRoutes);
router.use("/users", userRoutes); 
router.use("/visit", visitRoutes); 
router.use("/contact-button", FloatingActionButton);
router.use("/homeBadges", homeBadgeRoutes);
router.use("/facebook-group", facebookGroupRoutes);
router.use("/about", aboutRoutes);

export default router;
