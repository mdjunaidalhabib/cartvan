"use client";

import React from "react";
import { motion } from "framer-motion";

function Shimmer({ className = "" }) {
  return (
    <div className={`overflow-hidden relative rounded-lg ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
        animate={{ backgroundPosition: ["-200% 0", "200% 0"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 100%" }}
      />
    </div>
  );
}

export default function ProductCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      className="bg-white shadow-md p-3 rounded-lg flex flex-col"
    >
      {/* Image placeholder */}
      <Shimmer className="h-32 sm:h-44 rounded-lg mb-3" />

      {/* Title placeholder */}
      <Shimmer className="h-4 w-3/4 rounded mb-2" />

      {/* Subtitle placeholder */}
      <Shimmer className="h-4 w-1/2 rounded mb-3" />

      {/* Button placeholder */}
      <Shimmer className="mt-auto h-9 sm:h-10 rounded" />
    </motion.div>
  );
}
