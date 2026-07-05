"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "../skeletons/ProductCardSkeleton";
import { apiFetch } from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import cloudinaryLoader from "../../lib/cloudinaryLoader";
import OfferBadges from "./OfferBadges";
import { ArrowRight } from "lucide-react";

// ── Mouse drag-to-scroll hook ───────────────────────────────
// ✅ যেকোনো horizontal scroll container-এ mouse দিয়ে click-and-drag করে
// scroll করার জন্য। Card বা image-এর ভিতরে ক্লিক করলেও কাজ করবে, কিন্তু
// সত্যিকারের ক্লিক (drag ছাড়া) স্বাভাবিকভাবে product page-এ navigate করবে —
// কারণ ছোট movement কে drag হিসেবে ধরা হয় না।
// ⚠️ Fix: draggable="false" না থাকলে <img>/<Image>-এর নিজস্ব native drag
// (HTML5 image drag, ghost preview) ব্রাউজারের mousemove trap করে নেয় এবং
// আমাদের কাস্টম scroll লজিক আর কাজ করে না। তাই container-এর ভিতরের সব image-এ
// draggable={false} বসানো হয়েছে (ProductCard/HorizontalScrollRow wrapper-এ)।
function useDragScroll(ref) {
  const state = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const onMouseDown = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      state.current.isDown = true;
      state.current.moved = false;
      state.current.startX = e.pageX - el.offsetLeft;
      state.current.scrollLeft = el.scrollLeft;
      el.classList.add("cursor-grabbing");
    },
    [ref],
  );

  const endDrag = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    state.current.isDown = false;
    el.classList.remove("cursor-grabbing");
  }, [ref]);

  const onMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el || !state.current.isDown) return;
      // prevent native image ghost-drag/text-selection from hijacking the move
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = x - state.current.startX;
      if (Math.abs(walk) > 5) state.current.moved = true;
      el.scrollLeft = state.current.scrollLeft - walk;
    },
    [ref],
  );

  // ✅ drag করার সময় ভিতরের লিংক/বাটনে যেন accidental click না লাগে
  const onClickCapture = useCallback((e) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // ✅ native browser image-drag (dragstart) বন্ধ করে দাও, যাতে
  // image-এর উপর mouse down/move করলেও আমাদের custom scroll কাজ করে
  const onDragStart = useCallback((e) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("mouseleave", endDrag);
    return () => {
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("mouseleave", endDrag);
    };
  }, [ref, endDrag]);

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp: endDrag,
    onMouseLeave: endDrag,
    onClickCapture,
    onDragStart,
  };
}

// ── Horizontal scroll row (peek style) ─────────────────────
// ✅ mobile-এ ঠিক ২টা কার্ড পুরোপুরি + ৩নং কার্ডের একটা অংশ (peek) দেখা যায়,
// desktop-এ ~5টা কার্ড পুরোপুরি + পরের কার্ডের কিছুটা অংশ দেখা যায় —
// এতে ইউজার বুঝতে পারে যে আরও প্রোডাক্ট আছে (scroll করার hint)।
// ✅ scrollbar সম্পূর্ণ hidden (Chrome/Safari/Firefox সব জায়গায়)।
// ✅ মাউস দিয়ে click-and-drag করেও scroll করা যাবে — image-এর উপর
// ক্লিক করেও এখন drag/scroll কাজ করে (arrow বাটন সরিয়ে দেওয়া হয়েছে)।
function HorizontalScrollRow({ children, className = "" }) {
  const ref = useRef(null);
  const drag = useDragScroll(ref);

  return (
    <div className={`relative flex items-center ${className}`}>
      <div
        ref={ref}
        className="flex gap-2 sm:gap-3 w-full overflow-x-auto py-2 cursor-grab select-none [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={drag.onMouseDown}
        onMouseMove={drag.onMouseMove}
        onMouseUp={drag.onMouseUp}
        onMouseLeave={drag.onMouseLeave}
        onClickCapture={drag.onClickCapture}
        onDragStart={drag.onDragStart}
      >
        {children}
      </div>
    </div>
  );
}

// ── Category anchor smooth scroll ─────────────────────────
function scrollToCategory(id) {
  const el = document.getElementById(`category-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── hash → activeFilter map ────────────────────────────────
const HASH_FILTER_MAP = {
  "#cartvan-box": "cartvanBox",
  "#free-delivery": "freeDelivery",
  "#best-discount": "bestDiscount",
};

// ── activeFilter → hash map (reverse, badge click থেকে hash সেট করার জন্য) ──
const FILTER_HASH_MAP = {
  cartvanBox: "cartvan-box",
  freeDelivery: "free-delivery",
  bestDiscount: "best-discount",
};

// ── Filtered products row (Free Delivery / Best Discount / Cartvan Box) ──
// ✅ প্রোডাক্ট সংখ্যা যাই হোক না কেন (৫টা বা তার বেশি) — Free Delivery,
// Best Discount এবং Cartvan Box সবসময় একই normal wrap grid design
// দেখাবে। এতে item সংখ্যা বেশি হলেও card গুলো "সরু/সুতো" না হয়ে
// স্বাভাবিক size ধরে সারিতে বসে, এবং তিনটা section-ই consistent
// দেখায় — horizontal scroll ব্যবহার হয় না এখানে।
function ProductGrid({ products }) {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045 } },
  };
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {products.map((prod) => (
        <motion.div key={prod._id} variants={item}>
          <ProductCard product={prod} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
export default function CategoryTabsSection() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [badges, setBadges] = useState([]);

  const categoryNavRef = useRef(null);
  const categoryNavDrag = useDragScroll(categoryNavRef);

  // ✅ Badge ক্লিক করলে এখন hash-ও সেট হয় — এতে cross-page navigation,
  // browser back/forward, এবং URL শেয়ার করা সবকিছুই badge ক্লিকের সাথে
  // consistent থাকে।
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);

    if (filter) {
      const hash = FILTER_HASH_MAP[filter];
      if (hash && window.location.hash !== `#${hash}`) {
        history.replaceState(null, "", `#${hash}`);
      }
    } else if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
  };

  // ✅ URL hash থেকে filter set করো (page load + hash change দুটোতেই)
  useEffect(() => {
    const applyHashFilter = () => {
      const hash = window.location.hash.toLowerCase();
      const filter = HASH_FILTER_MAP[hash] ?? null;
      setActiveFilter(filter);

      if (filter) {
        setTimeout(() => {
          const el = document.getElementById("offer-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    };

    applyHashFilter();
    window.addEventListener("hashchange", applyHashFilter);
    return () => window.removeEventListener("hashchange", applyHashFilter);
  }, []);

  const mid = Math.ceil(categories.length / 2);
  const topRow = categories.slice(0, mid);
  const bottomRow = categories.slice(mid);

  useEffect(() => {
    const onOfferFilterChange = (e) => {
      handleFilterChange(e.detail ?? null);
      if (e.detail) {
        setTimeout(() => {
          const el = document.getElementById("offer-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    };
    window.addEventListener("offerFilterChange", onOfferFilterChange);
    return () =>
      window.removeEventListener("offerFilterChange", onOfferFilterChange);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(false);

      const [pRes, cRes, bRes] = await Promise.all([
        apiFetch("/products"),
        apiFetch("/categories"),
        apiFetch("/homeBadges").catch(() => ({ badges: [] })),
      ]);

      let pArr = Array.isArray(pRes) ? pRes : [];
      let cArr = Array.isArray(cRes) ? cRes : [];
      let bArr = Array.isArray(bRes?.badges) ? bRes.badges : [];

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
      setBadges(bArr);
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

  // ✅ "See All" ক্লিক করলে বিদ্যমান /categories/[id] page এ নিয়ে যায়,
  // যেখানে ওই ক্যাটাগরির সব প্রোডাক্ট দেখাবে (আলাদা পেজ, একই পেজে
  // wrap/expand হবে না)
  const goToCategoryPage = (cat) => {
    router.push(`/categories/${cat._id}`);
  };

  // ✅ Admin থেকে সেট করা badge name — না থাকলে fallback default দেখাবে
  const getBadgeName = (field, fallback) => {
    const b = badges.find((x) => x.field === field);
    return b?.name || fallback;
  };

  const filteredProducts = activeFilter
    ? products.filter((p) => p[activeFilter] === true)
    : products;

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
      {/* ✅ id="offer-section" —  navbar Cartvan Box বাটন এখানে scroll করে আসে */}
      <div id="offer-section" className="mb-4">
        <OfferBadges
          badges={badges}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Category Nav */}
      {/* ✅ scrollbar সম্পূর্ণ hidden + category বাটন আগের চেয়ে স্লিম
          ✅ মাউস দিয়ে drag করেও scroll করা যাবে */}
      <div
        ref={categoryNavRef}
        className="mb-6 px-2 overflow-x-auto cursor-grab select-none [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseDown={categoryNavDrag.onMouseDown}
        onMouseMove={categoryNavDrag.onMouseMove}
        onMouseUp={categoryNavDrag.onMouseUp}
        onMouseLeave={categoryNavDrag.onMouseLeave}
        onClickCapture={categoryNavDrag.onClickCapture}
        onDragStart={categoryNavDrag.onDragStart}
      >
        {/* Mobile: 2 Rows */}
        <div className="md:hidden w-max space-y-1.5">
          {/* Top Row */}
          <div className="flex gap-1.5">
            {topRow.map((cat) => (
              <button
                key={cat._id}
                onClick={() => {
                  handleFilterChange(null);
                  setTimeout(() => scrollToCategory(cat._id), 80);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm whitespace-nowrap"
              >
                <div className="relative w-6 h-6 overflow-hidden rounded-md border bg-white flex-shrink-0">
                  <Image
                    loader={cloudinaryLoader}
                    src={cat.image || "/no-image.png"}
                    alt={cat.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                    draggable={false}
                  />
                </div>

                <span className="text-[11px] font-medium text-gray-700">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="flex gap-1.5">
            {bottomRow.map((cat) => (
              <button
                key={cat._id}
                onClick={() => {
                  handleFilterChange(null);
                  setTimeout(() => scrollToCategory(cat._id), 80);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm whitespace-nowrap"
              >
                <div className="relative w-6 h-6 overflow-hidden rounded-md border bg-white flex-shrink-0">
                  <Image
                    loader={cloudinaryLoader}
                    src={cat.image || "/no-image.png"}
                    alt={cat.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                    draggable={false}
                  />
                </div>

                <span className="text-[11px] font-medium text-gray-700">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: 1 Row */}
        <div className="hidden md:flex gap-2 w-max">
          {[...topRow, ...bottomRow].map((cat) => (
            <button
              key={cat._id}
              onClick={() => {
                handleFilterChange(null);
                setTimeout(() => scrollToCategory(cat._id), 80);
              }}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm whitespace-nowrap"
            >
              <div className="relative w-7 h-7 overflow-hidden rounded-md border bg-white flex-shrink-0">
                <Image
                  loader={cloudinaryLoader}
                  src={cat.image || "/no-image.png"}
                  alt={cat.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                  draggable={false}
                />
              </div>

              <span className="text-xs font-medium text-gray-700">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {activeFilter ? (
            /* ── Filter view (Free Delivery / Best Discount / Cartvan Box) ── */
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm sm:text-lg font-bold text-gray-800">
                  {activeFilter === "freeDelivery" &&
                    `🚚 ${getBadgeName("freeDelivery", "Free Delivery")} Products`}
                  {activeFilter === "bestDiscount" &&
                    `🛍️ ${getBadgeName("bestDiscount", "Best Discount")} Products`}
                  {activeFilter === "cartvanBox" &&
                    `🎁 ${getBadgeName("cartvanBox", "Gift Box")} Products`}
                </h2>
                <div className="flex-1 h-px bg-gray-200" />
                <button
                  onClick={() => handleFilterChange(null)}
                  className="text-xs text-red-500 flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                  ✕ Clear Filter
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 py-10 text-sm"
                >
                  কোনো প্রোডাক্ট নেই
                </motion.p>
              ) : (
                <ProductGrid products={filteredProducts} />
              )}
            </motion.div>
          ) : (
            /* ── Normal category view ── */
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {categories.map((cat) => {
                const catProducts = products.filter(
                  (p) => String(p.category?._id) === String(cat._id),
                );
                if (!catProducts.length) return null;

                return (
                  <div key={cat._id} id={`category-${cat._id}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg border overflow-hidden">
                        <Image
                          loader={cloudinaryLoader}
                          src={cat.image || "/no-image.png"}
                          alt={cat.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          draggable={false}
                        />
                      </div>

                      <h2 className="text-sm sm:text-lg font-bold text-gray-800">
                        {cat.name}
                      </h2>

                      <div className="flex-1 h-px bg-gray-200" />

                      {/* ✅ এখন "See All" ক্লিক করলে /categories/[id] page এ
                          গিয়ে ওই ক্যাটাগরির সব প্রোডাক্ট দেখাবে */}
                      <button
                        onClick={() => goToCategoryPage(cat)}
                        className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
                      >
                        See All <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* ✅ ৬টা বা তার বেশি প্রোডাক্ট থাকলে mobile-এ ঠিক ২টা
                        card পুরোপুরি + ৩নং কার্ডের একটা অংশ (peek) দেখা
                        যায়, desktop-এ ~5টা কার্ড পুরোপুরি + পরের কার্ডের
                        কিছু অংশ (peek) দেখা যায় যাতে বোঝা যায় আরও প্রোডাক্ট
                        আছে (HorizontalScrollRow + drag scroll)।
                        ✅ ৫টা বা তার কম প্রোডাক্ট থাকলে normal wrap grid
                        দেখায়, যাতে card গুলো ফাঁকা জায়গা রেখে "সরু/সুতো"
                        না দেখিয়ে স্বাভাবিক size ধরে সারিতে বসে।

                        📐 mobile width হিসাব (gap-2 = 0.5rem, ২টা gap ধরে):
                        containerWidth = 2×card + 0.4×card(peek) + 2×gap
                                       = 2.4×card + 1rem
                        => card = (100% - 1rem) / 2.4
                        → w-[calc((100%-1rem)/2.4)]
                        (২.৪ সংখ্যাটা কমালে peek বেশি দেখাবে, বাড়ালে কম) */}
                    {catProducts.length <= 5 ? (
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {catProducts.map((prod) => (
                          <div
                            key={prod._id}
                            className="w-[44%] md:w-[19%] flex-shrink-0"
                          >
                            <ProductCard product={prod} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <HorizontalScrollRow>
                        {catProducts.map((prod) => (
                          <div
                            key={prod._id}
                            className="w-[calc((100%-1rem)/2.4)] md:w-[19%] flex-shrink-0"
                          >
                            <ProductCard product={prod} />
                          </div>
                        ))}
                      </HorizontalScrollRow>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
