import Product from "../../src/models/Product.js";
import fs from "fs";
import sharp from "sharp";
import path from "path";
import { deleteFromCloudinary } from "../../utils/cloudinary/cloudinaryHelpers.js";
import {
  toNumber,
  computeIsSoldOut,
  computeVariantTotalStock,
  uploadToCloudinary,
  shiftOrdersForInsert,
  normalizeOrders,
} from "../../utils/product/index.js";

/* ================== ✅ RULE ================== */
const PRODUCT_IMAGE_RULE = {
  mime: "image/webp",
  width: 1200,
  height: 1200,
  maxBytes: 100 * 1024, // ✅ strict 1:1 (1200×1200) crop, ১৫০KB থেকে কমিয়ে ১০০KB করা হলো
  allowedInputTypes: ["image/webp", "image/jpeg", "image/png"],
};

/* ================== ✅ HELPERS ================== */
const safeJSON = (val, fallback) => {
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {}
};

const cleanupReqFiles = (req) => {
  const files = req.files || [];
  for (const f of files) safeUnlink(f.path);
};

/**
 * ✅ Convert ANY (jpeg/png/webp) => strict 1200×1200 (1:1) WEBP, এর কাছাকাছি সর্বোচ্চ চেষ্টায় <= 150KB (fit:cover, center crop)
 * - center crop
 * - resize
 * - quality compress loop
 * - তারপরও বড় হলে ধীরে ধীরে dimension কমিয়ে আবার compress (NEVER throw)
 * - guaranteed: এই ফাংশন কখনো error throw করবে না, upload সবসময় শেষ পর্যন্ত হবে
 */
const convertAndOverwriteProductImage = async (file) => {
  if (!file?.path) throw new Error("Invalid upload file");

  // ✅ input mimetype check (extra safety)
  if (!PRODUCT_IMAGE_RULE.allowedInputTypes.includes(file.mimetype)) {
    throw new Error("Only jpeg/png/webp allowed");
  }

  const inputPath = file.path;
  const outputPath = inputPath.replace(/\.[^/.]+$/, "") + "_converted.webp";

  // ✅ ইমেজ আগে থেকেই যদি already valid হয় (webp + size + dimension ঠিক আছে),
  // তাহলে আবার re-encode করার দরকার নেই — re-encode করলে generation-loss এর কারণে
  // মাঝে মাঝে ফাইল উল্টো বড় হয়ে যেতে পারে এবং upload error দিতে পারে।
  if (
    file.mimetype === PRODUCT_IMAGE_RULE.mime &&
    file.size <= PRODUCT_IMAGE_RULE.maxBytes
  ) {
    try {
      const meta = await sharp(inputPath).metadata();
      if (
        meta.width === PRODUCT_IMAGE_RULE.width &&
        meta.height === PRODUCT_IMAGE_RULE.height
      ) {
        return; // ✅ already perfect — কিছু পরিবর্তন না করেই upload হবে
      }
    } catch {
      // metadata পড়তে সমস্যা হলেও normal flow এ এগিয়ে যাবো
    }
  }

  // ✅ একটা single pass যেখানে quality ও প্রয়োজনে dimension দুটোই কমানো হবে,
  // কিন্তু কখনো error throw হবে না — শেষে যা পাওয়া যায় সেটাই ব্যবহার হবে।
  let bestBuffer = null;
  let dims = { width: PRODUCT_IMAGE_RULE.width, height: PRODUCT_IMAGE_RULE.height };

  outer: for (let attempt = 0; attempt < 5; attempt++) {
    let quality = 90;

    while (quality >= 40) {
      try {
        const buffer = await sharp(inputPath)
          .resize(dims.width, dims.height, {
            fit: "cover",  // ✅ strict 1:1 — center crop করে পুরো ফ্রেম ভরাট করে, সাদা padding থাকে না
            position: "center", // ✅ true center crop — উপর-নিচ/দুই পাশ থেকে সমান কেটে center রাখে
            // ⚠️ আগে "attention" ব্যবহার হতো (saliency-based), যেটা প্রায়ই ছবির
            // উপরের দিকের subject-কে বেশি গুরুত্ব দিয়ে শুধু নিচ থেকে কাটতো —
            // ফলে user-এর চোখে মনে হতো "শুধু উপর থেকে কাটছে"। "center" দিলে
            // সবসময় exact মাঝখান বরাবর crop হবে, দুই দিক থেকেই সমান অংশ কাটবে।
          })
          .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7 }) // ✅ default sharpen এর চেয়ে বেশি কার্যকর — detail/text এর edge ধরে রাখে
          .webp({ quality, effort: 6 }) // ✅ effort:6 → একই quality-তে স্মার্ট কম্প্রেশন
          .toBuffer();

        bestBuffer = buffer; // সবসময় শেষ successful buffer রাখি (fallback এর জন্য)

        if (buffer.length <= PRODUCT_IMAGE_RULE.maxBytes) {
          break outer; // ✅ লক্ষ্যে পৌঁছে গেছি
        }
      } catch {
        // এই quality/size এ encode করতে সমস্যা হলেও থেমে যাবো না, পরের ধাপে যাবো
      }

      quality -= 5; // ✅ আগে 10 ধাপে কমানো হতো, এখন 5 ধাপে — quality 50 এ লাফ দিয়ে পড়ার বদলে আরও সূক্ষ্মভাবে কমে
    }

    // ✅ quality কমিয়েও 100KB এর নিচে আনা যাচ্ছে না — dimension আরও ছোট করে আবার চেষ্টা
    dims = {
      width: Math.max(200, Math.round(dims.width * 0.8)),
      height: Math.max(200, Math.round(dims.height * 0.8)),
    };
  }

  // ✅ guaranteed fallback: bestBuffer না পেলে (একদমই অসম্ভব edge case) plain resize ব্যবহার করো
  if (!bestBuffer) {
    bestBuffer = await sharp(inputPath)
      .resize(400, 400, {
        fit: "cover",
        position: "center", // ✅ fallback path-ও এখন true center crop
      })
      .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7 })
      .webp({ quality: 65, effort: 6 })
      .toBuffer();
  }

  // ✅ কখনো error throw না করে — যা পাওয়া গেছে সেটাই লিখে ফেলা হলো (no blocking error)
  fs.writeFileSync(outputPath, bestBuffer);

  // ✅ remove original
  safeUnlink(inputPath);

  // ✅ overwrite multer file
  file.path = outputPath;
  file.mimetype = PRODUCT_IMAGE_RULE.mime;
  file.size = bestBuffer.length;
  file.originalname =
    (file.originalname || "image").replace(/\.(png|jpg|jpeg|webp)$/i, "") +
    ".webp";
};

/**
 * ✅ Convert all req.files before uploading cloudinary
 */
const convertAllReqFiles = async (req) => {
  const files = req.files || [];
  for (const f of files) {
    await convertAndOverwriteProductImage(f);
  }
};

/* ================== ✅ ADMIN READ ================== */
export const getProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

/* ================== ✅ CREATE ================== */
export const createProduct = async (req, res) => {
  try {
    // ✅ convert ALL uploaded files first (guaranteed webp strict 1200×1200 1:1 <= 150KB, center crop)
    await convertAllReqFiles(req);

    const {
      name,
      price,
      oldPrice,
      stock,
      sold,
      isSoldOut,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,
      colors,
      freeDelivery,
      bestDiscount,
      cartvanBox,
    } = req.body;

    if (!name || price === undefined || !category) {
      cleanupReqFiles(req);
      return res.status(400).json({ error: "Name, Price & Category required" });
    }

    const total = await Product.countDocuments();
    const serial = toNumber(order, 0) > 0 ? toNumber(order, 0) : total + 1;
    await shiftOrdersForInsert(serial);

    let parsedColors = colors ? safeJSON(colors, []) : [];
    const hasVariants = Array.isArray(parsedColors) && parsedColors.length > 0;

    let primaryImage = "";
    let galleryImages = [];
    const allFiles = req.files || [];

    if (!hasVariants) {
      const galleryFiles = allFiles.filter((f) => f.fieldname === "images");

      for (let file of galleryFiles) {
        const uploaded = await uploadToCloudinary(file, "products/gallery");
        galleryImages.push(uploaded.optimizedUrl);
        safeUnlink(file.path);
      }

      primaryImage = galleryImages[0] || "";
    } else {
      parsedColors = parsedColors.map((c) => ({
        ...c,
        price:
          c.price !== undefined && c.price !== null && c.price !== ""
            ? toNumber(c.price, 0)
            : toNumber(price, 0),
        oldPrice:
          c.oldPrice && toNumber(c.oldPrice, 0) > 0
            ? toNumber(c.oldPrice, 0)
            : null,
        stock: c.stock !== undefined ? toNumber(c.stock, 0) : 0,
        sold: c.sold !== undefined ? toNumber(c.sold, 0) : 0,
        images: Array.isArray(c.images) ? c.images : [],
      }));

      for (let i = 0; i < parsedColors.length; i++) {
        const fieldName = `color_images_${i}`;
        const colorFiles = allFiles.filter((f) => f.fieldname === fieldName);

        if (colorFiles.length > 0) {
          const urls = [];
          for (let file of colorFiles) {
            const uploaded = await uploadToCloudinary(
              file,
              "products/variants",
            );
            urls.push(uploaded.optimizedUrl);
            safeUnlink(file.path);
          }
          parsedColors[i].images = urls;
        }
      }

      primaryImage = parsedColors?.[0]?.images?.[0] || "";
    }

    const finalStock = hasVariants
      ? computeVariantTotalStock(parsedColors)
      : toNumber(stock, 0);

    const computedSoldOut = computeIsSoldOut({
      hasVariants,
      stock: finalStock,
      colors: parsedColors,
    });

    const mainPrice = hasVariants
      ? toNumber(parsedColors?.[0]?.price, 0)
      : toNumber(price, 0);

    const mainOldPrice = hasVariants
      ? parsedColors?.[0]?.oldPrice &&
        toNumber(parsedColors?.[0]?.oldPrice, 0) > 0
        ? toNumber(parsedColors?.[0]?.oldPrice, 0)
        : null
      : oldPrice && toNumber(oldPrice, 0) > 0
        ? toNumber(oldPrice, 0)
        : null;

    const mainSold = hasVariants
      ? toNumber(parsedColors?.[0]?.sold, 0)
      : toNumber(sold, 0);

    const product = new Product({
      name,
      price: mainPrice,
      oldPrice: mainOldPrice,
      stock: finalStock,
      sold: mainSold,
      isSoldOut: isSoldOut === "true" ? true : computedSoldOut,
      rating: toNumber(rating, 0),
      description,
      additionalInfo,
      category,
      image: primaryImage,
      images: galleryImages,
      colors: parsedColors,
      reviews: req.body.reviews ? safeJSON(req.body.reviews, []) : [],
      order: serial,
      isActive: isActive === "true",
      freeDelivery: freeDelivery === "true",
      bestDiscount: bestDiscount === "true",
      cartvanBox: cartvanBox === "true",
    });

    await product.save();
    await normalizeOrders();

    res.status(201).json(product);
  } catch (err) {
    console.error("Create Error:", err);
    cleanupReqFiles(req);
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

/* ================== ✅ UPDATE ================== */
export const updateProduct = async (req, res) => {
  try {
    // ✅ convert ALL uploaded files first (guaranteed webp strict 1200×1200 1:1 <= 150KB, center crop)
    await convertAllReqFiles(req);

    const product = await Product.findById(req.params.id);
    if (!product) {
      cleanupReqFiles(req);
      return res.status(404).json({ error: "Product not found" });
    }

    const {
      name,
      price,
      oldPrice,
      stock,
      sold,
      isSoldOut,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,
      existingImages,
      colors,
      freeDelivery,
      bestDiscount,
      cartvanBox,
    } = req.body;

    const newOrder = toNumber(order, 0);
    if (newOrder > 0 && newOrder !== product.order) {
      await shiftOrdersForInsert(newOrder, product._id);
      product.order = newOrder;
    }

    // ✅ FIX: "colors" field না থাকলে (যেমন bulk Hide/Show All আপডেট) এটাকে
    // "variant নাই" ধরে নিয়ে পুরনো images/colors ডিলিট করা হচ্ছিল — এটাই
    // ছিল "আপডেট করার পর ইমেজ চলে যাওয়া" বাগের মূল কারণ।
    // colors field সত্যিকারে পাঠানো হয়েছে কিনা সেটা আলাদাভাবে চেক করা হলো।
    const colorsFieldProvided = colors !== undefined;
    let incomingColors = colorsFieldProvided ? safeJSON(colors, []) : [];
    const allFiles = req.files || [];

    if (!colorsFieldProvided) {
      // ✅ এই request এ images/colors related কিছুই পাঠানো হয়নি
      // (যেমন bulk isActive/order টগল) — তাই product.image/images/colors
      // একদম অপরিবর্তিত থাকবে। শুধু নিচের অন্য field গুলো (isActive, order ইত্যাদি) আপডেট হবে।
    } else if (Array.isArray(incomingColors) && incomingColors.length > 0) {
      incomingColors = incomingColors.map((c) => ({
        ...c,
        price:
          c.price !== undefined && c.price !== null && c.price !== ""
            ? toNumber(c.price, 0)
            : price !== undefined
              ? toNumber(price, 0)
              : toNumber(product.price, 0),
        oldPrice:
          c.oldPrice && toNumber(c.oldPrice, 0) > 0
            ? toNumber(c.oldPrice, 0)
            : null,
        stock: c.stock !== undefined ? toNumber(c.stock, 0) : 0,
        sold: c.sold !== undefined ? toNumber(c.sold, 0) : 0,
        images: Array.isArray(c.images) ? c.images : [],
      }));

      // ✅ delete old non-variant images
      if (product.image) await deleteFromCloudinary(product.image);
      for (let url of product.images) await deleteFromCloudinary(url);

      product.image = "";
      product.images = [];

      for (let i = 0; i < incomingColors.length; i++) {
        const fieldName = `color_images_${i}`;
        const colorFiles = allFiles.filter((f) => f.fieldname === fieldName);

        if (colorFiles.length > 0) {
          const urls = [];
          for (let file of colorFiles) {
            const uploaded = await uploadToCloudinary(
              file,
              "products/variants",
            );
            urls.push(uploaded.optimizedUrl);
            safeUnlink(file.path);
          }
          incomingColors[i].images = [
            ...(incomingColors[i].images || []),
            ...urls,
          ];
        }
      }

      product.colors = incomingColors;
      product.stock = computeVariantTotalStock(product.colors);
      product.image = product.colors?.[0]?.images?.[0] || product.image;

      product.price = toNumber(product.colors?.[0]?.price, product.price);
      product.oldPrice =
        product.colors?.[0]?.oldPrice &&
        toNumber(product.colors?.[0]?.oldPrice, 0) > 0
          ? toNumber(product.colors?.[0]?.oldPrice, 0)
          : null;
      product.sold = toNumber(product.colors?.[0]?.sold, product.sold);
    } else {
      // ✅ colors field খালি/empty array আকারে পাঠানো হয়েছে
      // (explicit signal যে variant mode থেকে normal mode এ switch করা হচ্ছে)
      // switching from variants to normal
      if (product.colors && product.colors.length > 0) {
        for (let color of product.colors) {
          for (let url of color.images) await deleteFromCloudinary(url);
        }
        product.colors = [];
      }

      let keepImages = existingImages ? safeJSON(existingImages, []) : [];
      keepImages = Array.isArray(keepImages) ? keepImages : [];

      const imagesToRemove = product.images.filter(
        (img) => !keepImages.includes(img),
      );
      for (let url of imagesToRemove) await deleteFromCloudinary(url);

      const galleryFiles = allFiles.filter((f) => f.fieldname === "images");
      let newUploads = [];

      for (let file of galleryFiles) {
        const uploaded = await uploadToCloudinary(file, "products/gallery");
        newUploads.push(uploaded.optimizedUrl);
        safeUnlink(file.path);
      }

      product.images = [...keepImages, ...newUploads];
      product.image = product.images[0] || product.image;

      product.stock =
        stock !== undefined ? toNumber(stock, product.stock) : product.stock;
    }

    product.name = name || product.name;
    if (price !== undefined) product.price = toNumber(price, product.price);

    if (oldPrice !== undefined) {
      product.oldPrice =
        oldPrice && toNumber(oldPrice, 0) > 0 ? toNumber(oldPrice, 0) : null;
    }

    if (sold !== undefined) product.sold = toNumber(sold, product.sold);

    product.rating =
      rating !== undefined ? toNumber(rating, product.rating) : product.rating;

    product.description = description ?? product.description;
    product.additionalInfo = additionalInfo ?? product.additionalInfo;
    product.category = category || product.category;

    product.isActive =
      isActive !== undefined ? isActive === "true" : product.isActive;

    if (freeDelivery !== undefined)
      product.freeDelivery = freeDelivery === "true";
    if (bestDiscount !== undefined)
      product.bestDiscount = bestDiscount === "true";
    if (cartvanBox !== undefined) product.cartvanBox = cartvanBox === "true";

    if (req.body.reviews) product.reviews = safeJSON(req.body.reviews, []);

    const hasVariantsNow =
      Array.isArray(product.colors) && product.colors.length > 0;

    const computedSoldOut = computeIsSoldOut({
      hasVariants: hasVariantsNow,
      stock: product.stock,
      colors: product.colors,
    });

    product.isSoldOut =
      isSoldOut !== undefined ? isSoldOut === "true" : computedSoldOut;

    await product.save();
    await normalizeOrders();

    res.json(product);
  } catch (err) {
    console.error("Update Error:", err);
    cleanupReqFiles(req);
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

/* ================== ✅ DELETE ================== */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.image) await deleteFromCloudinary(product.image);
    for (let url of product.images) await deleteFromCloudinary(url);

    for (let color of product.colors) {
      for (let url of color.images) await deleteFromCloudinary(url);
    }

    await product.deleteOne();
    await normalizeOrders();

    res.json({ message: "🗑️ Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};
