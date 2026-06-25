"use client";

import React from "react";
import { FaShippingFast, FaShoppingBag, FaGift } from "react-icons/fa";
import { motion } from "framer-motion";

const badges = [
  {
    key: "freeDelivery",
    label: "Free Delivery",
    Icon: FaShippingFast,
    streakColor: "from-transparent via-orange-200/90 to-transparent",
    glowColor: "rgba(251,146,60,0.55)",
    activeBg: "bg-orange-100",
    activeBorder: "border-orange-400",
    inactiveBg: "bg-[#FFF5EE]",
    iconGradient: "from-orange-400 to-red-500",
    hoverBorder: "hover:border-orange-300",
    // icon animation — delivery truck দৌড়ায়
    iconAnimate: {
      x: [0, 3, -1, 3, 0],
      rotate: [0, -4, 0, 4, 0],
    },
  },
  {
    key: "bestDiscount",
    label: "Best Discount",
    Icon: FaShoppingBag,
    streakColor: "from-transparent via-indigo-200/90 to-transparent",
    glowColor: "rgba(99,102,241,0.55)",
    activeBg: "bg-blue-100",
    activeBorder: "border-blue-400",
    inactiveBg: "bg-[#F4F9FF]",
    iconGradient: "from-blue-400 to-indigo-600",
    hoverBorder: "hover:border-blue-300",
    // bag দুলতে থাকে
    iconAnimate: {
      rotate: [-8, 8, -8, 8, 0],
      y: [0, -1, 0, -1, 0],
    },
  },
  {
    key: "cartvanBox",
    label: "Cartvan Box",
    Icon: FaGift,
    streakColor: "from-transparent via-rose-200/90 to-transparent",
    glowColor: "rgba(251,113,133,0.55)",
    activeBg: "bg-rose-100",
    activeBorder: "border-rose-400",
    inactiveBg: "bg-rose-50",
    iconGradient: "from-pink-400 to-rose-500",
    hoverBorder: "hover:border-rose-300",
    // gift box bounce করে
    iconAnimate: {
      y: [0, -3, 0, -2, 0],
      scale: [1, 1.15, 1, 1.1, 1],
    },
  },
];

export default function OfferBar({ activeFilter, onFilterChange }) {
  const handleClick = (filter) => {
    onFilterChange(activeFilter === filter ? null : filter);
  };

  return (
    <div className="flex flex-nowrap justify-center items-center gap-1 md:gap-8 lg:gap-14 w-full px-1">
      {badges.map((b) => {
        const isActive = activeFilter === b.key;

        return (
          <motion.button
            key={b.key}
            onClick={() => handleClick(b.key)}
            whileTap={{ scale: 0.91 }}
            animate={
              isActive
                ? { scale: [1, 1.07, 1.04], transition: { duration: 0.28 } }
                : { scale: 1 }
            }
            className={`relative flex items-center gap-1 md:gap-1.5
              px-2 py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-1.5 rounded-md
              cursor-pointer border overflow-hidden
              transition-colors duration-300
              ${
                isActive
                  ? `${b.activeBg} ${b.activeBorder}`
                  : `${b.inactiveBg} border-transparent ${b.hoverBorder}`
              }`}
            style={
              isActive
                ? {
                    boxShadow: `0 0 10px 2px ${b.glowColor}, 0 0 22px 5px ${b.glowColor}40`,
                  }
                : {}
            }
          >
            {/* ── Streak — সরু, তীক্ষ্ণ আলোর রেখা ── */}
            <motion.span
              aria-hidden
              className={`pointer-events-none absolute top-0 left-0 h-full bg-gradient-to-r ${b.streakColor} skew-x-[-20deg]`}
              style={{ width: "38%" }}
              animate={{ x: ["-110%", "320%"] }}
              transition={{
                duration: isActive ? 0.9 : 1.6,
                repeat: Infinity,
                repeatDelay: isActive ? 0.5 : 1.4,
                ease: [0.4, 0, 0.2, 1],
              }}
            />

            {/* দ্বিতীয় পাতলা রেখা — একটু পিছনে */}
            <motion.span
              aria-hidden
              className={`pointer-events-none absolute top-[30%] left-0 h-[40%] bg-gradient-to-r ${b.streakColor} skew-x-[-20deg] opacity-60`}
              style={{ width: "18%" }}
              animate={{ x: ["-110%", "320%"] }}
              transition={{
                duration: isActive ? 0.9 : 1.6,
                repeat: Infinity,
                repeatDelay: isActive ? 0.5 : 1.4,
                delay: 0.13,
                ease: [0.4, 0, 0.2, 1],
              }}
            />

            {/* ── Active glow pulse border ── */}
            {isActive && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-md border-2"
                style={{ borderColor: b.glowColor }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* ── Icon — সব সময় নড়ে ── */}
            <div
              className={`relative flex items-center justify-center
                w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6
                rounded bg-gradient-to-br ${b.iconGradient} text-white flex-shrink-0`}
            >
              <motion.div
                animate={b.iconAnimate}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
              >
                <b.Icon className="text-[10px] md:text-[12px] lg:text-[14px]" />
              </motion.div>
            </div>

            {/* ── Label ── */}
            <span className="relative text-[13px] md:text-[18px] lg:text-[20px] font-medium whitespace-nowrap">
              {b.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
