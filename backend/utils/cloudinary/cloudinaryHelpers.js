import cloudinary from "./cloudinary.js";

/**
 * ✅ Extract cloudinary public_id from ANY Cloudinary URL
 * Supports:
 * - transformed urls (.../upload/w_600,h_600,.../v123/folder/name.webp)
 * - normal urls (.../upload/v123/folder/name.webp)
 * - nested folders
 */
const extractPublicIdFromUrl = (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== "string") return null;

    const clean = imageUrl.split("?")[0];

    const parts = clean.split("/upload/");
    if (parts.length < 2) return null;

    let afterUpload = parts[1]; // transformations + v123 + folder path

    // ✅ find /v123/ segment
    const vIndex = afterUpload.search(/\/v\d+\//);

    if (vIndex !== -1) {
      // remove transformations part, keep after v123/
      afterUpload = afterUpload.slice(vIndex + 1); // remove leading "/"
      afterUpload = afterUpload.replace(/^v\d+\//, "");
    } else {
      // no version: could be transformations only or direct folder path
      // if first segment looks like transformation (contains ",")
      const segs = afterUpload.split("/");
      if (segs[0].includes(",")) {
        afterUpload = segs.slice(1).join("/");
      }
    }

    // ✅ remove extension
    const publicId = afterUpload.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, "");

    return publicId || null;
  } catch {
    return null;
  }
};

/**
 * ✅ Shared helper — public_id থেকে f_auto,q_auto:good সহ optimized delivery URL বানায়।
 * Product upload flow-এ (utils/product/product.upload.js) আগে থেকেই এভাবে বানানো হতো,
 * এখন category/footer/navbar/slider/profile upload-গুলোও একই standard ব্যবহার করছে
 * যাতে Cloudinary নিজে থেকেই format/quality optimize করে দেয় (raw secure_url না দিয়ে)।
 */
export const buildOptimizedUrl = (publicId) => {
  if (!publicId) return "";

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ fetch_format: "auto", quality: "auto:good" }],
  });
};

/* ✅ URL থেকে ডিলিট */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    const publicId = extractPublicIdFromUrl(imageUrl);

    if (!publicId) {
      console.warn("⚠️ Could not extract public_id from:", imageUrl);
      return;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (result?.result !== "ok" && result?.result !== "not found") {
      console.warn("⚠️ Cloudinary delete response:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ Cloudinary deleteFromCloudinary error:", error);
  }
};

/* ✅ public_id দিয়ে ডিলিট (Footer/Navbar Logo / Admin avatar) */
export const deleteByPublicId = async (publicId) => {
  try {
    if (!publicId) return;

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (result?.result !== "ok" && result?.result !== "not found") {
      console.warn("⚠️ Cloudinary delete response:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ Cloudinary deleteByPublicId error:", error);
  }
};
