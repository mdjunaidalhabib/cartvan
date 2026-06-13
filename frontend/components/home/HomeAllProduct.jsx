"use client";

import React, { useEffect, useState, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton";
import { apiFetch } from "../../utils/api";
import { motion } from "framer-motion";
import Image from "next/image";
import OfferBadges from "./OfferBadges";
import { ChevronLeft, ChevronRight, ArrowRight, ChevronUp } from "lucide-react";

// ── Horizontal scroll row ─────────────────────────────────
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
      {/* Left */}
      <button
        onClick={() => scroll(-1)}
        className={`hidden md:flex absolute left-0 z-10 -translate-x-1/2 w-8 h-8 items-center justify-center rounded-full bg-white border shadow ${
          canLeft ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Scroll */}
      <div
        ref={ref}
        className="flex gap-2 sm:gap-3 overflow-x-auto w-full"
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>

      {/* Right */}
      <button
        onClick={() => scroll(1)}
        className={`hidden md:flex absolute right-0 z-10 translate-x-1/2 w-8 h-8 items-center justify-center rounded-full bg-white border shadow ${
          canRight ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
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
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (catId) =>
    setExpanded((prev) => ({ ...prev, [catId]: !prev[catId] }));

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 px-4 py-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.section className="container mx-auto px-3 sm:px-6 py-4">
      {/* Offers */}
      <div className="mb-4">
        <OfferBadges />
      </div>

      {/* 🔥 Compact Category Nav */}
      <div className="mb-6 px-2">
        <HorizontalScrollRow>
          {categories.map((cat) => (
            <a
              key={cat._id}
              href={`#category-${cat._id}`}
              className="
                flex-shrink-0 flex items-center 
                gap-1 sm:gap-2
                px-2 py-1 sm:px-3 sm:py-2
                bg-white border border-gray-200
                rounded-lg sm:rounded-xl
                shadow-sm hover:shadow-md
                transition whitespace-nowrap
              "
            >
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-md sm:rounded-lg border bg-white">
                <Image
                  src={cat.image || "/no-image.png"}
                  alt={cat.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>

              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {cat.name}
              </span>
            </a>
          ))}
        </HorizontalScrollRow>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const catProducts = products.filter(
            (p) => String(p.category?._id) === String(cat._id),
          );
          if (!catProducts.length) return null;

          const isExpanded = expanded[cat._id];

          return (
            <div key={cat._id} id={`category-${cat._id}`}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg border overflow-hidden">
                  <Image
                    src={cat.image || "/no-image.png"}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <h2 className="text-sm sm:text-lg font-bold text-gray-800">
                  {cat.name}
                </h2>

                <div className="flex-1 h-px bg-gray-200" />

                <button
                  onClick={() => toggleExpand(cat._id)}
                  className="text-xs text-blue-600 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>
                      Less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      All <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

              {/* Products */}
              {isExpanded ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {catProducts.map((prod) => (
                    <ProductCard key={prod._id} product={prod} />
                  ))}
                </div>
              ) : (
                <HorizontalScrollRow>
                  {catProducts.map((prod) => (
                    <div
                      key={prod._id}
                      className="w-[140px] sm:w-[170px] flex-shrink-0"
                    >
                      <ProductCard product={prod} />
                    </div>
                  ))}
                </HorizontalScrollRow>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
