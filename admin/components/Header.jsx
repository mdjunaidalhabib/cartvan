"use client";

import { useState } from "react";
import { Button } from "./button";
import { Menu, X } from "lucide-react";
import MenuBar from "./MenuBar";
import { navItems, settingsChildren } from "./menuConfig";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow p-2 md:p-7 flex items-center justify-between relative">
      {/* Title center এ */}
      <h1 className="text-xl font-bold absolute left-1/2 transform -translate-x-1/2">
        Admin Panel
      </h1>
      {/* বাম দিকে ফাঁকা জায়গা */}
      <div className="w-8 md:hidden" />

      {/* Menu Icon এখন ডান পাশে */}
      <div className="md:hidden">
        <Button variant="ghost" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? (
            <X className="text-rose-600" size={24} />
          ) : (
            <Menu className="text-rose-600" size={24} />
          )}
        </Button>
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
