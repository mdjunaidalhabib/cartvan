"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import cloudinaryLoader from "../../lib/cloudinaryLoader";
import { usePathname } from "next/navigation";
import { FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";

export default function AccountMenuDesktop() {
  const { me, setMe, loadingUser } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();

  // বাইরে ক্লিক করলে বন্ধ হবে
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // রুট পরিবর্তন হলে dropdown বন্ধ
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const dropdownAnim = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  if (loadingUser) {
    return (
      <button className="p-2 rounded text-gray-400 flex items-center gap-1" disabled>
        <FaUser className="w-6 h-6" /> <br />
      </button>
    );
  }

  if (!me) {
    return (
      <button
        onClick={() => {
          // ✅ শুধু path পাঠানো হচ্ছে, origin না — cross-domain redirect এ token হারানো ঠেকাতে
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/api/auth/google?redirect=${encodeURIComponent(
            currentPath
          )}`;
        }}
        className="p-2 rounded hover:bg-pink-300 flex items-center gap-1"
      >
        <FaUser /> Login
      </button>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMe(null);
    window.location.replace("/"); // ✅ replace() দিয়ে history stack clean রাখো
  };

  return (
    <div ref={menuRef} className="relative">
      {/* 👤 Avatar / Name */}
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded flex items-center gap-1 transition ${
          pathname === "/profile" || pathname === "/orders"
            ? "text-pink-600 bg-pink-300 border border-pink-400 font-medium"
            : "text-gray-900 hover:text-pink-600 hover:bg-pink-300"
        }`}
      >
        {me.avatar ? (
          <Image loader={cloudinaryLoader}
            src={me.avatar}
            alt={me.name}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover aspect-square shrink-0"
          />
        ) : (
          <FaUser className="w-5 h-5" />
        )}
        {me.name?.split(" ")[0]}
      </button>

      {/* 🎬 Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownAnim}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded z-50 border border-gray-100"
          >
            {/* 🧍 User Info */}
            <div className="flex items-center gap-3 px-3 py-3 border-b text-gray-800">
              {me.avatar ? (
                <Image loader={cloudinaryLoader}
                  src={me.avatar}
                  alt={me.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover aspect-square shrink-0"
                />
              ) : (
                <FaUser className="w-6 h-6" />
              )}
              <span className="font-medium truncate">{me.name}</span>
            </div>

            {/* 🔗 Links */}
            <Link
              href="/profile"
              className={`block px-3 py-2 rounded transition ${
                pathname === "/profile"
                  ? "text-pink-600 bg-pink-300 border border-pink-400 font-medium"
                  : "text-gray-900 hover:text-pink-600 hover:bg-pink-300"
              }`}
            >
              My Profile
            </Link>

            <Link
              href="/orders"
              className={`block px-3 py-2 rounded transition ${
                pathname === "/orders"
                  ? "text-pink-600 bg-pink-300 border border-pink-400 font-medium"
                  : "text-gray-900 hover:text-pink-600 hover:bg-pink-300"
              }`}
            >
              My Orders
            </Link>

            {/* 🚪 Logout */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
