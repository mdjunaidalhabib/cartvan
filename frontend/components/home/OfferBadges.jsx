"use client";

import React from "react";
import {
  FaShippingFast,
  FaShoppingBag,
  FaGift,
  FaTag,
  FaFire,
  FaStar,
  FaPercent,
} from "react-icons/fa";
import { motion } from "framer-motion";

// ✅ icon key (DB-তে সেভ হওয়া) → actual react-icon component
const ICON_MAP = {
  truck: FaShippingFast,
  bag: FaShoppingBag,
  gift: FaGift,
  tag: FaTag,
  fire: FaFire,
  star: FaStar,
  percent: FaPercent,
};

// ✅ প্রতিটা technical field-এর জন্য একটা fixed color theme —
// নাম/আইকন Admin থেকে বদলালেও এই থিম consistent থাকবে
const THEME_MAP = {
  freeDelivery: {
    streakColor: "from-transparent via-orange-200/90 to-transparent",
    glowColor: "rgba(251,146,60,0.55)",
    activeBg: "bg-orange-100",
    activeBorder: "border-orange-400",
    inactiveBg: "bg-[#FFF5EE]",
    iconGradient: "from-orange-400 to-red-500",
    hoverBorder: "hover:border-orange-300",
    iconAnimate: { x: [0, 3, -1, 3, 0], rotate: [0, -4, 0, 4, 0] },
  },
  bestDiscount: {
    streakColor: "from-transparent via-indigo-200/90 to-transparent",
    glowColor: "rgba(99,102,241,0.55)",
    activeBg: "bg-blue-100",
    activeBorder: "border-blue-400",
    inactiveBg: "bg-[#F4F9FF]",
    iconGradient: "from-blue-400 to-indigo-600",
    hoverBorder: "hover:border-blue-300",
    iconAnimate: { rotate: [-8, 8, -8, 8, 0], y: [0, -1, 0, -1, 0] },
  },
  cartvanBox: {
    streakColor: "from-transparent via-rose-200/90 to-transparent",
    glowColor: "rgba(251,113,133,0.55)",
    activeBg: "bg-rose-100",
    activeBorder: "border-rose-400",
    inactiveBg: "bg-rose-50",
    iconGradient: "from-pink-400 to-rose-500",
    hoverBorder: "hover:border-rose-300",
    iconAnimate: { y: [0, -3, 0, -2, 0], scale: [1, 1.15, 1, 1.1, 1] },
  },
};

const DEFAULT_THEME = THEME_MAP.cartvanBox;

// ✅ Admin panel থেকে badge না এলে (লোড হওয়ার আগে / API fail) fallback
const FALLBACK_BADGES = [
  { field: "freeDelivery", name: "Free Delivery", icon: "truck" },
  { field: "bestDiscount", name: "Best Discount", icon: "bag" },
  { field: "cartvanBox", name: "Gift Box", icon: "gift" },
];

export default function OfferBar({ badges, activeFilter, onFilterChange }) {
  const list =
    Array.isArray(badges) && badges.length > 0 ? badges : FALLBACK_BADGES;

  const handleClick = (field) => {
    onFilterChange(activeFilter === field ? null : field);
  };

  return (
    <div className="grid grid-cols-3 sm:flex sm:flex-wrap sm:justify-center gap-1.5 sm:gap-3 w-full px-1">
      {list.map((badge) => {
        const key = badge.field;
        const b = { ...(THEME_MAP[key] || DEFAULT_THEME) };
        const Icon = ICON_MAP[badge.icon] || FaGift;
        const isActive = activeFilter === key;

        return (
          <motion.button
            key={badge._id || key}
            onClick={() => handleClick(key)}
            whileTap={{ scale: 0.91 }}
            animate={
              isActive
                ? { scale: [1, 1.07, 1.04], transition: { duration: 0.28 } }
                : { scale: 1 }
            }
            className={`relative flex sm:inline-flex items-center justify-center gap-0.5 md:gap-2
              w-full sm:w-fit min-w-0 flex-shrink-0
              px-0 py-1 sm:px-3.5 sm:py-2 lg:px-4 lg:py-2.5 rounded-md
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
                <Icon className="text-[10px] md:text-[12px] lg:text-[14px]" />
              </motion.div>
            </div>

            {/* ── Label — এডমিন প্যানেল থেকে দেওয়া নাম ── */}
            <span className="relative min-w-0 truncate sm:whitespace-nowrap sm:overflow-visible sm:text-clip text-[11px] sm:text-[14px] lg:text-[15px] font-medium">
              {badge.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
