"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminHeaderCard from "./AdminHeaderCard";

export default function MenuBar({
  items,
  settingsChildren = [],
  onItemClick,
  vertical = true,
  collapsed = false,
}) {
  const pathname = usePathname();
  const [openSettings, setOpenSettings] = useState(false);

  useEffect(() => {
    if (pathname && pathname.startsWith("/settings")) setOpenSettings(true);
  }, [pathname]);

  // Collapse করলে সাবমেনু বন্ধ রাখি, যাতে আইকন-অনলি ভিউ পরিষ্কার থাকে
  useEffect(() => {
    if (collapsed) setOpenSettings(false);
  }, [collapsed]);

  return (
    <nav className="flex flex-col h-full">
      <div className={collapsed ? "shrink-0 pt-1 pb-2" : "shrink-0 p-2"}>
        <AdminHeaderCard collapsed={collapsed} />
      </div>
      {!collapsed && <div className="mx-2 mb-1 border-b border-gray-100" />}

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 sidebar-scroll">
        <div
          className={`${
            vertical ? "flex-col space-y-1" : "flex-row space-x-2"
          } flex ${collapsed ? "items-center" : ""}`}
        >
          {items.map(({ icon, label, href }) => {
            if (label === "Settings") {
              const parentActive = pathname.startsWith("/settings");

              return (
                <div key="settings" className="w-full">
                  <button
                    onClick={() => setOpenSettings((s) => !s)}
                    aria-expanded={openSettings}
                    title={collapsed ? label : undefined}
                    className={`w-full flex items-center gap-2 py-2 rounded transition ${
                      collapsed ? "justify-center px-2" : "justify-between px-4"
                    } ${
                      parentActive
                        ? "bg-gray-200 font-semibold text-blue-600"
                        : "hover:bg-rose-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 shrink-0">
                        {icon}
                      </span>
                      {!collapsed && <span>{label}</span>}
                    </span>
                    {!collapsed && (
                      <ChevronDown
                        className={`transition-transform ${
                          openSettings ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {openSettings && !collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-1 flex flex-col overflow-hidden"
                      >
                        {settingsChildren.map(
                          ({ icon: cIcon, label: cLabel, href: cHref }) => {
                            const active = pathname === cHref;
                            return (
                              <Link
                                key={cLabel}
                                href={cHref}
                                onClick={onItemClick}
                                className={`flex items-center gap-2 ml-6 px-4 py-2 rounded transition text-sm ${
                                  active
                                    ? "bg-rose-50 font-semibold text-rose-600"
                                    : "hover:bg-rose-50"
                                }`}
                              >
                                {cIcon}
                                <span>{cLabel}</span>
                              </Link>
                            );
                          }
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            const active = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                onClick={onItemClick}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-2 py-2 rounded transition ${
                  collapsed ? "justify-center px-2" : "px-4"
                } ${
                  active
                    ? "bg-rose-50 font-semibold text-rose-600"
                    : "hover:bg-rose-50"
                }`}
              >
                <span className="flex items-center justify-center w-5 h-5 shrink-0">
                  {icon}
                </span>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
