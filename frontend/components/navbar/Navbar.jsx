"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import {
  FaHome,
  FaThLarge,
  FaSearch,
  FaUserCircle,
  FaGift,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

import SearchBox from "./SearchBox";
import AccountMenuDesktop from "./AccountMenuDesktop";
import AccountMenuMobile from "./AccountMenuMobile";
import CartIcon from "./CartIcon";
import WishlistIcon from "./WishlistIcon";
import { useUser } from "../../context/UserContext";

const sideMenu = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
  exit: { x: "-100%" },
};
const topBar = { open: { rotate: 45, y: 10 }, closed: { rotate: 0, y: 0 } };
const middleBar = { open: { opacity: 0 }, closed: { opacity: 1 } };
const bottomBar = { open: { rotate: -45, y: -7 }, closed: { rotate: 0, y: 0 } };

export default function Navbar() {
  const [navbar, setNavbar] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { me } = useUser();

  const pathname = usePathname();
  const router = useRouter();
  const { cart = {}, wishlist = [] } = useCart() || {};
  const cartCount = Object.keys(cart).length;
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;
  const API_URL = "/api";

  useEffect(() => {
    const fetchNavbar = async () => {
      try {
        const res = await fetch(`${API_URL}/navbar`);
        const data = await res.json();
        const brand = data?.brand || {};
        if (!("name" in brand)) brand.name = "";
        if (!("logo" in brand)) brand.logo = "";
        setNavbar({ ...data, brand });
      } catch (err) {
        console.error("❌ Failed to load navbar:", err);
      }
    };
    fetchNavbar();
  }, [API_URL]);

  useEffect(() => {
    setImgError(false);
  }, [navbar?.brand?.logo]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
  }, [menuOpen]);

  const isActive = (path) => pathname === path;

  const handleCartvanBox = () => {
    if (pathname === "/") {
      window.dispatchEvent(
        new CustomEvent("offerFilterChange", { detail: "cartvanBox" }),
      );
    } else {
      router.push("/#cartvan-box");
    }
  };

  const handleLogoClick = (e) => {
    if (pathname === "/") {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("offerFilterChange", { detail: null }),
      );
    }
  };

  return (
    <>
      {/* ───────────── Top Navbar ───────────── */}
      <nav className="bg-pink-100 text-gray-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto w-full flex justify-between items-center py-3 px-4 md:px-8">
          {/* 📱 Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden relative w-8 h-8 flex flex-col justify-center items-center gap-[5px] z-50"
          >
            <motion.span
              variants={topBar}
              animate={menuOpen ? "open" : "closed"}
              transition={{ duration: 0.3 }}
              className="block h-1 w-6 bg-pink-600 rounded"
            />
            <motion.span
              variants={middleBar}
              animate={menuOpen ? "open" : "closed"}
              transition={{ duration: 0.3 }}
              className="block h-1 w-6 bg-pink-600 rounded"
            />
            <motion.span
              variants={bottomBar}
              animate={menuOpen ? "open" : "closed"}
              transition={{ duration: 0.3 }}
              className="block h-1 w-6 bg-pink-600 rounded"
            />
          </button>

          {/* 🏷 Brand */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="flex items-center gap-3"
          >
            {navbar?.brand?.logo && !imgError ? (
              <img
                src={navbar.brand.logo}
                alt={navbar?.brand?.name || "Brand"}
                className="h-8 w-8 md:h-10 md:w-10 object-cover rounded-lg"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-pink-50 rounded-lg border border-pink-200">
                <FaUserCircle className="text-pink-300 w-6 h-6" />
              </div>
            )}
            {navbar?.brand?.name?.trim() ? (
              <span className="text-xl font-bold text-pink-600 block min-w-[100px] truncate">
                {navbar.brand.name.trim()}
              </span>
            ) : (
              <div className="h-6 w-32 bg-pink-200 rounded-lg animate-pulse" />
            )}
          </Link>

          {/* 📱 Mobile — Search icon + Account */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              className="p-2 rounded-lg hover:bg-pink-200 transition-colors"
              onClick={() => setMobileSearchOpen(true)}
            >
              <FaSearch className="w-5 h-5 text-pink-600" />
            </button>
            <AccountMenuMobile topbar />
          </div>

          {/* 💻 Desktop Menu */}
          <div className="hidden md:flex items-center gap-2 font-medium">
            {[
              { href: "/", label: "Home" },
              { href: "/products", label: "All Products" },
              { href: "/categories", label: "Shop by Category" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-200 ${
                  isActive(href)
                    ? "text-pink-600 bg-pink-300 border border-pink-400 font-medium"
                    : "text-gray-900 hover:text-pink-600 hover:bg-pink-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* 💻 Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 relative">
            {/* ✅ Desktop-only SearchBox */}
            <SearchBox
              mobileSearchOpen={mobileSearchOpen}
              setMobileSearchOpen={setMobileSearchOpen}
            />
            <div
              className={`rounded transition-all duration-200 ${pathname.startsWith("/profile") || pathname.startsWith("/orders") ? "text-pink-600 bg-pink-300 border border-pink-400 font-medium" : "text-gray-900 hover:text-pink-600 hover:bg-pink-200"}`}
            >
              <AccountMenuDesktop />
            </div>
            <div
              className={`rounded transition-all duration-200 p-2 ${isActive("/cart") ? "text-pink-600 bg-pink-300 border border-pink-400 font-medium" : "text-gray-900 hover:text-pink-600 hover:bg-pink-200"}`}
            >
              <CartIcon cartCount={cartCount} />
            </div>
            <div
              className={`rounded transition-all duration-200 p-2 ${isActive("/wishlist") ? "text-pink-600 bg-pink-300 border border-pink-400 font-medium" : "text-gray-900 hover:text-pink-600 hover:bg-pink-200"}`}
            >
              <WishlistIcon wishlistCount={wishlistCount} />
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ Mobile-only SearchBox — সবসময় render হয়, fixed dropdown দেখায় */}
      <div className="md:hidden">
        <SearchBox
          mobileSearchOpen={mobileSearchOpen}
          setMobileSearchOpen={setMobileSearchOpen}
        />
      </div>

      {/* 📱 Mobile Side Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              variants={sideMenu}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed top-[60px] left-0 bottom-0 w-56 bg-pink-50 shadow-lg p-3 flex flex-col space-y-2.5 z-50 text-[15px]"
            >
              {[
                {
                  href: "/",
                  icon: <FaHome className="w-4 h-4" />,
                  label: "Home",
                },
                {
                  href: "/products",
                  icon: <FaThLarge className="w-4 h-4" />,
                  label: "Products",
                },
                {
                  href: "/categories",
                  icon: <FaThLarge className="w-4 h-4" />,
                  label: "Categories",
                },
                {
                  href: "/wishlist",
                  icon: <WishlistIcon className="w-4 h-4" />,
                  label: "Wishlist",
                },
              ].map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded transition-all duration-200 ${
                    isActive(href)
                      ? "text-pink-600 bg-pink-200 font-medium"
                      : "text-gray-700 hover:text-pink-600 hover:bg-pink-100"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {icon}
                  <span>{label}</span>
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ───────────── 📱 Bottom Navigation ───────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-pink-100 border-t border-pink-300">
        <div className="relative flex justify-between items-center px-4 py-2">
          <Link
            href="/"
            className={`flex flex-col items-center text-[11px] gap-0.5 ${isActive("/") ? "text-pink-500" : "text-gray-900"}`}
          >
            <FaHome className="w-5 h-5" />
            <span>Home</span>
          </Link>

          <Link
            href="/categories"
            className={`flex flex-col items-center text-[11px] gap-0.5 ${isActive("/categories") ? "text-pink-500" : "text-gray-900"}`}
          >
            <FaThLarge className="w-5 h-5" />
            <span>Category</span>
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-50">
            <motion.button
              onClick={handleCartvanBox}
              animate={{ y: [0, -5, 0], scale: [1, 1.02, 1] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-13 h-13 flex flex-col items-center justify-center rounded-full border-2 border-pink-200 overflow-hidden active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, #ff49db, #ff007f)",
                boxShadow:
                  "0 0 22px 6px rgba(255, 0, 127, 0.7), 0 0 10px 2px rgba(255, 73, 219, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.4)",
              }}
            >
              <motion.span
                aria-hidden
                className="absolute top-0 left-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] pointer-events-none"
                animate={{ x: ["-150%", "300%"] }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  repeatDelay: 0.9,
                  ease: "easeInOut",
                }}
              />
              <FaGift className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(255,0,127,0.5)] mb-0.5" />
              <span className="text-[10px] font-semibold text-white tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] leading-none">
                Gift
              </span>
            </motion.button>
          </div>

          <div className="w-12" />

          <div
            className={`flex flex-col items-center text-[11px] gap-0.5 ${isActive("/wishlist") ? "text-pink-500" : "text-gray-900"}`}
          >
            <WishlistIcon wishlistCount={wishlistCount} mobile />
          </div>

          <div
            className={`flex flex-col items-center text-[11px] gap-0.5 ${isActive("/cart") ? "text-pink-500" : "text-gray-900"}`}
          >
            <CartIcon cartCount={cartCount} mobile />
          </div>
        </div>
      </div>
    </>
  );
}
