"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const useDebouncedValue = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const ProductCard = ({ product, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 transition text-left"
  >
    <img
      src={product.image || product.images?.[0] || "/placeholder.png"}
      alt={product.name}
      className="w-10 h-10 rounded-lg object-cover border bg-white"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 truncate">
        {product.name}
      </p>
    </div>
  </button>
);

export default function SearchBox({ mobileSearchOpen, setMobileSearchOpen }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const desktopRef = useRef(null);
  const mobileInputRef = useRef(null);

  const goToProduct = useCallback(
    (id) => {
      setQuery("");
      setResults([]);
      setMobileSearchOpen(false);
      router.push(`/products/${id}`);
    },
    [router, setMobileSearchOpen],
  );

  // Auto focus mobile input when opened
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [mobileSearchOpen]);

  // Close mobile search on outside click
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const handler = (e) => {
      if (!e.target.closest("#mobile-search-container")) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileSearchOpen, setMobileSearchOpen]);

  // Fetch results
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/products`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const products = Array.isArray(data) ? data : data.products || [];
        const filtered = products.filter((p) =>
          p.name?.toLowerCase().includes(q.toLowerCase()),
        );
        if (!cancelled) setResults(filtered.slice(0, 20));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const ResultList = () => (
    <>
      {loading && (
        <p className="px-3 py-2 text-gray-500 text-sm">Searching...</p>
      )}
      {!loading &&
        results.length > 0 &&
        results.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            onClick={() => goToProduct(p._id)}
          />
        ))}
      {!loading && debouncedQuery && results.length === 0 && (
        <p className="px-3 py-2 text-gray-500 text-sm">No results found</p>
      )}
    </>
  );

  return (
    <>
      {/* 🖥 Desktop Search */}
      <div className="hidden md:block relative" ref={desktopRef}>
        <input
          type="text"
          placeholder="Search products..."
          className="rounded-lg px-3 py-1 w-64 border border-pink-300 focus:outline-none focus:border-pink-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <AnimatePresence>
          {(loading || results.length > 0 || (debouncedQuery && !loading)) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute mt-1 w-64 bg-white shadow-xl rounded-xl max-h-72 overflow-y-auto p-2 z-50"
            >
              <ResultList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 📱 Mobile Search — same page dropdown, navbar-এর নিচে */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            id="mobile-search-container"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-[60px] left-0 right-0 z-50 bg-white shadow-xl border-t border-pink-100"
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-pink-100">
              <Search className="w-4 h-4 text-pink-400 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search products..."
                className="flex-1 focus:outline-none text-sm bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => setMobileSearchOpen(false)}
                className="p-1 shrink-0"
              >
                <X className="w-5 h-5 text-rose-500" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
              {!debouncedQuery ? (
                <p className="text-gray-400 text-sm px-2">
                  Type to search products...
                </p>
              ) : (
                <ResultList />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
