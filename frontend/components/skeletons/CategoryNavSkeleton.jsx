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

export default function CategoryNavSkeleton({ count = 6 }) {
  return (
    <div className="flex gap-3 overflow-hidden mb-8 px-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm"
        >
          <Shimmer className="w-10 h-10 rounded-lg" />
          <Shimmer className="w-16 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}
