"use client";
import React from "react";

export default function CategorySkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-3 md:p-6">
      {/* === Category Sidebar Skeleton === */}
      <div className="md:w-64 bg-white shadow-md rounded-xl p-3 md:p-4 overflow-hidden">
        <div className="h-5 w-32 bg-gray-300 rounded mb-3 shimmer"></div>

        <ul className="flex md:flex-col gap-3 overflow-x-auto md:space-y-2 no-scrollbar">
          {[...Array(5)].map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 overflow-hidden shimmer"
            >
              <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </li>
          ))}
        </ul>
      </div>

      {/* === Product List Skeleton === */}
      <div className="flex-1">
        <div className="h-6 w-40 bg-gray-300 rounded mb-4 shimmer"></div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white shadow-sm p-3 overflow-hidden shimmer"
            >
              <div className="w-full h-40 bg-gray-300 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>

      {/* === Shimmer Animation === */}
      <style jsx>{`
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          width: 150%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          100% {
            left: 150%;
          }
        }
      `}</style>
    </div>
  );
}
