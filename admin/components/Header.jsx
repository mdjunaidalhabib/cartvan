"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "./button";
import { Menu, X } from "lucide-react";
import MenuBar from "./MenuBar";
import LogoutButton from "./LogoutButton";
import LiveDateTime from "./LiveDateTime";
import { navItems, settingsChildren } from "./menuConfig";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const res = await axios.get("/api/admin/verify", {
          withCredentials: true,
        });
        setAdminName(res.data?.admin?.name || "");
      } catch (err) {
        console.error("Failed to load admin info:", err);
      }
    };

    loadAdmin();
  }, []);

  const displayName = adminName || "Admin";

  return (
    <header className="bg-white shadow p-2 md:px-6 md:py-2.5 flex items-center justify-between gap-2 relative">
      {/* বাম দিকে: Admin কে লক্ষ্য করে ওয়েলকাম মেসেজ */}
      <div className="min-w-0 flex-1">
        <h1
          className="text-sm md:text-base font-bold text-gray-800 truncate"
          title={`স্বাগতম, ${displayName}`}
        >
          স্বাগতম, {displayName} 
        </h1>
        <p className="hidden md:block text-xs text-gray-500 truncate">
          আজকের কার্যক্রম পরিচালনা করতে প্রস্তুত? আপনার ড্যাশবোর্ডে সব কিছু
          গুছানো আছে।
        </p>
      </div>

      {/* Title - বড় স্ক্রিনে সেন্টারে */}
      <h1 className="hidden lg:block text-lg font-bold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700">
        Admin Panel
      </h1>

      {/* ডান দিকে: তারিখ-সময়, লগআউট বাটন এবং মোবাইল মেনু */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <LiveDateTime />
        <LogoutButton />

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="!rounded-full !h-9 !w-9 bg-gray-50 border border-gray-200"
          >
            {menuOpen ? (
              <X className="text-rose-600" size={20} />
            ) : (
              <Menu className="text-gray-600" size={20} />
            )}
          </Button>
        </div>
      </div>

      {/* মোবাইল মেনু */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setMenuOpen(false)}
            />

            {/* সাইড মেনু আগের মতো বাম দিক থেকে খুলবে */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 h-[100dvh] w-64 bg-white shadow-lg z-50 p-4 pb-[env(safe-area-inset-bottom,0px)] overflow-y-auto"
            >
              <MenuBar
                items={navItems}
                settingsChildren={settingsChildren}
                onItemClick={() => setMenuOpen(false)}
                vertical={true}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
