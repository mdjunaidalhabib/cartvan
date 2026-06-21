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
  width: 600,
  height: 600,
  maxBytes: 100 * 1024, // ✅ 100KB (same as frontend)
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
 * ✅ Convert ANY (jpeg/png/webp) => 600×600 WEBP <= 100KB
 * - center crop
 * - resize
 * - compress loop
 * - overwrite file.path so uploadToCloudinary uploads converted file
 */
const convertAndOverwriteProductImage = async (file) => {
  if (!file?.path) throw new Error("Invalid upload file");

  // ✅ input mimetype check (extra safety)
  if (!PRODUCT_IMAGE_RULE.allowedInputTypes.includes(file.mimetype)) {
    throw new Error("Only jpeg/png/webp allowed");
  }

  const inputPath = file.path;
  const outputPath = inputPath.replace(/\.[^/.]+$/, "") + "_converted.webp";

  // ✅ sharp pipeline (center crop)
  const base = sharp(inputPath).resize(
    PRODUCT_IMAGE_RULE.width,
    PRODUCT_IMAGE_RULE.height,
    {
      fit: "cover",
      position: "centre",
    },
  );

  // ✅ compress loop
  let quality = 90;
  let buffer = await base.webp({ quality }).toBuffer();

  while (buffer.length > PRODUCT_IMAGE_RULE.maxBytes && quality > 30) {
    quality -= 7;
    buffer = await sharp(inputPath)
      .resize(PRODUCT_IMAGE_RULE.width, PRODUCT_IMAGE_RULE.height, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality })
      .toBuffer();
  }

  if (buffer.length > PRODUCT_IMAGE_RULE.maxBytes) {
    throw new Error(
      `Could not compress under ${Math.floor(
        PRODUCT_IMAGE_RULE.maxBytes / 1024,
      )}KB`,
    );
  }

  // ✅ write file
  fs.writeFileSync(outputPath, buffer);

  // ✅ remove original
  safeUnlink(inputPath);

  // ✅ overwrite multer file
  file.path = outputPath;
  file.mimetype = PRODUCT_IMAGE_RULE.mime;
  file.size = buffer.length;
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
    // ✅ convert ALL uploaded files first (guaranteed webp 600×600 <= 100KB)
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
    // ✅ convert ALL uploaded files first (guaranteed webp 600×600 <= 100KB)
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

    let incomingColors = colors ? safeJSON(colors, []) : [];
    const allFiles = req.files || [];

    if (Array.isArray(incomingColors) && incomingColors.length > 0) {
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
      // ✅ switching from variants to normal
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
