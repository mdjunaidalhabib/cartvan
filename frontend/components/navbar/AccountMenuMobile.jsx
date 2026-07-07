"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import cloudinaryLoader from "../../lib/cloudinaryLoader";
import { FaUser, FaClipboardList, FaSignOutAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmModal from "../ConfirmModal";
import { useUser } from "../../context/UserContext";
import { usePathname } from "next/navigation";

export default function AccountMenuMobile({ onOpen }) {
  const { me, setMe, loadingUser } = useUser();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pathname = usePathname();

  if (loadingUser) {
    return (
      <button className="flex flex-col items-center text-pink-400" disabled>
        <FaUser className="w-5 h-5" />
      </button>
    );
  }

  if (!me) {
    return (
      <>
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex flex-col items-center text-pink-500"
        >
          <FaUser className="w-5 h-5" />
        </button>

        <ConfirmModal
          open={confirmOpen}
          message="আপনি কি Google দিয়ে লগইন করতে চান?"
          onConfirm={() => {
            // ✅ শুধু path পাঠানো হচ্ছে, origin না — যাতে cartvan.com / www.cartvan.com
            // এর মধ্যে redirect করলে token (localStorage) হারিয়ে না যায়
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/api/auth/google?redirect=${encodeURIComponent(currentPath)}`;
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      </>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMe(null);
    window.location.replace("/"); // ✅ replace() দিয়ে history stack clean রাখো
  };

  const isActive = (route) => pathname === route;

  const MenuItem = ({ href, label, icon: Icon }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => {
          setOpen(false);
          if (onOpen) onOpen();
        }}
        className={`flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100 transition-all duration-300 ease-in-out ${
          active ? "text-rose-600 bg-rose-50" : "text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2 transition-colors duration-300">
          <Icon
            className={`w-5 h-5 transition-colors duration-300 ${
              active ? "text-rose-600" : "text-gray-600"
            }`}
          />
          <span>{label}</span>
        </div>
        {active && <div className="w-2 h-2 rounded-full bg-rose-500 transition-all duration-300" />}
      </Link>
    );
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (onOpen) onOpen();
        }}
        className="flex flex-col items-center"
      >
        {me.avatar ? (
          <Image loader={cloudinaryLoader}
            src={me.avatar}
            alt={me.name}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover aspect-square"
          />
        ) : (
          <FaUser className="w-5 h-5 text-pink-600" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 bg-black/50 z-50 flex">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3 }}
              className="bg-white w-full h-full p-6 relative"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-2 rounded text-rose-600 hover:bg-gray-100 transition-colors duration-200"
                aria-label="Close account menu"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                {me.avatar ? (
                  <Image loader={cloudinaryLoader}
                    src={me.avatar}
                    alt={me.name}
                    width={30}
                    height={30}
                    className="w-[30px] h-[30px] rounded-full object-cover aspect-square shrink-0"
                  />
                ) : (
                  <FaUser className="w-8 h-8" />
                )}
                <span className="font-semibold text-lg truncate text-gray-800 ">{me.name}</span>
              </div>

              <MenuItem href="/profile" label="My Profile" icon={FaUser} />
              <MenuItem href="/orders" label="My Orders" icon={FaClipboardList} />

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 w-full rounded hover:bg-gray-100 text-gray-700 transition-all duration-300"
              >
                <FaSignOutAlt className="w-5 h-5 mr-2 text-gray-600" />
                <span>Logout</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
