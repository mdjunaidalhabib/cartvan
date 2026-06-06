"use client";

import React, { useEffect, useState, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import CategoryNavSkeleton from "./CategoryNavSkeleton";
import { apiFetch } from "../../utils/api";
import { motion } from "framer-motion";
import Image from "next/image";
import OfferBadges from "./OfferBadges";
import { ChevronLeft, ChevronRight, ArrowRight, ChevronUp } from "lucide-react";

// ── Horizontal scroll row ──────────────────────────────────────────────────────
function HorizontalScrollRow({ children, className = "" }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(update, 100);
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [children]);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className={`
          absolute left-0 z-10 -translate-x-1/2
          w-8 h-8 flex items-center justify-center
          rounded-full bg-white border border-gray-200 shadow-md
          text-gray-600 hover:text-blue-600 hover:border-blue-400 hover:shadow-lg
          transition-all duration-200
          ${canLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className={`
          absolute right-0 z-10 translate-x-1/2
          w-8 h-8 flex items-center justify-center
          rounded-full bg-white border border-gray-200 shadow-md
          text-gray-600 hover:text-blue-600 hover:border-blue-400 hover:shadow-lg
          transition-all duration-200
          ${canRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Full page skeleton ─────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      {/* Offer badges placeholder */}
      <div className="h-12 w-full rounded-xl bg-gray-100 mb-6 overflow-hidden relative">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
          animate={{ backgroundPosition: ["-200% 0", "200% 0"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>

      {/* Category nav skeleton */}
      <CategoryNavSkeleton />

      {/* Category sections skeleton */}
      <div className="space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="scroll-mt-24">
            {/* Section header skeleton */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="h-5 w-28 rounded bg-gray-200" />
              <div className="flex-1 h-px bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>

            {/* Product row skeleton */}
            <div className="px-5 flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="flex-shrink-0 w-[calc(50vw-2.5rem)] sm:w-[175px]"
                >
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CategoryTabsSection() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [pRes, cRes] = await Promise.all([
        apiFetch("/products"),
        apiFetch("/categories"),
      ]);

      let pArr = Array.isArray(pRes) ? pRes : [];
      let cArr = Array.isArray(cRes) ? cRes : [];

      cArr = cArr.filter((c) => c.isActive !== false);
      cArr.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
      pArr.sort((a, b) => {
        const ao = Number(a.order ?? 0);
        const bo = Number(b.order ?? 0);
        if (ao !== bo) return ao - bo;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setProducts(pArr);
      setCategories(cArr);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpand = (catId) =>
    setExpanded((prev) => ({ ...prev, [catId]: !prev[catId] }));

  /* ── LOADING ── */
  if (loading) return <PageSkeleton />;

  /* ── ERROR ── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-500 text-sm mb-4 text-center">
          ডেটা লোড করা যায়নি। ইন্টারনেট বা সার্ভার সমস্যা হতে পারে।
        </p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition"
        >
          🔄 আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  /* ── RENDER ── */
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-8"
    >
      {/* Offer Badges */}
      <div className="mb-6">
        <OfferBadges />
      </div>

      {/* ── Category Navigation ── */}
      <div className="mb-8 px-5">
        <HorizontalScrollRow>
          {categories.map((cat) => (
            <a
              key={cat._id}
              href={`#category-${cat._id}`}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-300 whitespace-nowrap"
            >
              <div className="relative w-10 h-10 overflow-hidden rounded-lg border bg-white">
                <Image
                  src={cat.image || "/no-image.png"}
                  alt={cat.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {cat.name}
              </span>
            </a>
          ))}
        </HorizontalScrollRow>
      </div>

      {/* ── Category Sections ── */}
      <div className="space-y-10">
        {categories.map((cat) => {
          const catProducts = products.filter(
            (p) => String(p.category?._id) === String(cat._id)
          );
          if (catProducts.length === 0) return null;

          const isExpanded = !!expanded[cat._id];

          return (
            <div
              key={cat._id}
              id={`category-${cat._id}`}
              className="scroll-mt-24"
            >
              {/* ── Category Header ── */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 overflow-hidden rounded-xl border bg-white shadow-sm flex-shrink-0">
                  <Image
                    src={cat.image || "/no-image.png"}
                    alt={cat.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>

                <h2 className="text-base md:text-lg font-bold text-gray-800 whitespace-nowrap">
                  {cat.name}
                </h2>

                <div className="flex-1 h-px bg-gray-100" />

                <button
                  onClick={() => toggleExpand(cat._id)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition whitespace-nowrap"
                >
                  {isExpanded ? (
                    <>
                      Show less
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      See all ({catProducts.length})
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

              {/* ── Products ── */}
              {isExpanded ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                >
                  {catProducts.map((prod, i) => (
                    <ProductCard key={prod._id} product={prod} priority={i < 5} />
                  ))}
                </motion.div>
              ) : (
                <div className="px-5">
                  <HorizontalScrollRow>
                    {catProducts.map((prod, i) => (
                      <div
                        key={prod._id}
                        className="flex-shrink-0 w-[calc(50vw-2.5rem)] sm:w-[175px]"
                      >
                        <ProductCard product={prod} priority={i < 4} />
                      </div>
                    ))}
                  </HorizontalScrollRow>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
