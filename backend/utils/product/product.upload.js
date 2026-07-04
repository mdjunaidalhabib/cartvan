import { cloudinary } from "../cloudinary/index.js";
import fs from "fs";
import streamifier from "streamifier";

/**
 * ✅ Sharp দিয়ে backend-এ image process হয়ে যায় (strict 1200×1200 1:1, webp, <=150KB)
 * তাই Cloudinary-তে upload এর সময় আর কোনো transformation দরকার নেই।
 * শুধু f_auto,q_auto:good দিয়ে serve করব — crop/resize নয়।
 */
const makeOptimizedUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { fetch_format: "auto", quality: "auto:good" }, // ✅ eco → good: detail ধরে রাখে
    ],
  });
};

export const uploadToCloudinary = async (file, folder) => {
  if (!file) throw new Error("No file provided");

  // ✅ Sharp ইতিমধ্যে সব process করেছে — Cloudinary-তে as-is upload, কোনো re-transform নয়
  // ✅ 1) memoryStorage
  if (file?.buffer) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" }, // ← transformation নেই
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });

    return {
      ...result,
      optimizedUrl: makeOptimizedUrl(result.public_id),
    };
  }

  // ✅ 2) diskStorage
  if (file?.path) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "image", // ← transformation নেই
    });

    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (e) {
      console.warn("⚠️ Could not delete local file:", file.path);
    }

    return {
      ...result,
      optimizedUrl: makeOptimizedUrl(result.public_id),
    };
  }

  throw new Error("Invalid file: missing buffer/path");
};
