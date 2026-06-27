"use client";
import React, { useState, useEffect } from "react";
import {
  FaPhoneAlt,
  FaWhatsapp,
  FaFacebookMessenger,
  FaTimes,
  FaRegCommentDots,
} from "react-icons/fa";

const formatWhatsapp = (raw) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits; // already has country code
  if (digits.startsWith("0")) return "88" + digits; // 01X... → 8801X...
  return "880" + digits; // fallback
};

const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch("/api/contact-button")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) =>
        console.error("❌ Failed to load contact button config", err),
      );
  }, []);

  // data না আসা পর্যন্ত কিছু দেখাবো না
  if (!config || !config.enabled) return null;

  const { phone, whatsapp, messenger } = config;

  return (
    <div className="fixed bottom-24 right-4 flex flex-col items-center space-y-3 z-[9999]">
      {/* সোশ্যাল আইকনগুলো */}
      <div
        className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-5 pointer-events-none"
        }`}
      >
        {phone && (
          <a
            href={`tel:${phone}`}
            className={`bg-green-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
              open ? "animate-bounce delay-100" : ""
            }`}
          >
            <FaPhoneAlt size={22} />
          </a>
        )}

        {whatsapp && (
          <a
            href={`https://wa.me/${formatWhatsapp(whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
              open ? "animate-bounce delay-200" : ""
            }`}
          >
            <FaWhatsapp size={22} />
          </a>
        )}

        {messenger && (
          <a
            href={messenger}
            target="_blank"
            rel="noopener noreferrer"
            className={`bg-[#0084FF] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
              open ? "animate-bounce delay-300" : ""
            }`}
          >
            <FaFacebookMessenger size={22} />
          </a>
        )}
      </div>

      {/* মূল বাটন */}
      <button
        onClick={() => setOpen(!open)}
        className={`bg-pink-600 text-white p-3 rounded-full shadow-xl hover:bg-pink-700 
          transition-all duration-300 flex items-center justify-center transform-gpu z-[9999]
          active:scale-95 ${open ? "scale-105 shadow-2xl" : "scale-100"}`}
      >
        <span
          className={`absolute w-12 h-12 rounded-full bg-pink-500/40 animate-ping 
            ${open ? "hidden" : "block"}`}
        />
        <div
          className={`transition-transform duration-100 ease-in-out ${
            open ? "rotate-180 scale-110" : "rotate-0 scale-100 animate-bounce"
          }`}
        >
          {open ? <FaTimes size={20} /> : <FaRegCommentDots size={20} />}
        </div>
      </button>
    </div>
  );
};

export default FloatingActionButton;
