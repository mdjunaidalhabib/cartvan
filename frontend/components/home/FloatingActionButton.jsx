"use client";
import React, { useState, useEffect } from "react";
import {
  FaPhoneAlt,
  FaWhatsapp,
  FaFacebookMessenger,
  FaTimes,
  FaHeadset,
} from "react-icons/fa";

const formatWhatsapp = (raw) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return "88" + digits;
  return "880" + digits;
};

const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch("/api/contact-button")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("❌ Error loading config", err));
  }, []);

  if (!config || !config.enabled) return null;

  const { phone, whatsapp, messenger } = config;

  return (
    <div className="fixed bottom-18 right-2 z-[9999] flex flex-col items-center gap-2.5">
      {/* স্লিম ও ছোট কন্টাক্ট লিস্ট (যা ওপরের দিকে খুলবে) */}
      <div
        className={`flex flex-col items-center gap-2.5 transition-all duration-300 ease-in-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {phone && (
          <a
            href={`tel:${phone}`}
            style={{ transitionDelay: open ? "150ms" : "0ms" }}
            className={`w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-300 ${
              open ? "scale-100 translate-y-0" : "scale-75 translate-y-2"
            }`}
          >
            <FaPhoneAlt size={15} />
          </a>
        )}

        {whatsapp && (
          <a
            href={`https://wa.me/${formatWhatsapp(whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ transitionDelay: open ? "100ms" : "0ms" }}
            className={`w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-300 ${
              open ? "scale-100 translate-y-0" : "scale-75 translate-y-2"
            }`}
          >
            <FaWhatsapp size={18} />
          </a>
        )}

        {messenger && (
          <a
            href={messenger}
            target="_blank"
            rel="noopener noreferrer"
            style={{ transitionDelay: open ? "50ms" : "0ms" }}
            className={`w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-300 ${
              open ? "scale-100 translate-y-0" : "scale-75 translate-y-2"
            }`}
          >
            <FaFacebookMessenger size={17} />
          </a>
        )}
      </div>

      {/* মেইন মিনিমালিস্ট ট্রিগার বাটন */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 border active:scale-90 ${
          open
            ? "bg-slate-900 border-rose-500/40 text-rose-400"
            : "bg-indigo-600 border-indigo-400/20 text-white hover:bg-indigo-700"
        }`}
      >
        {/* রিল্যাক্সড পালস অ্যানিমেশন (শুধু বন্ধ থাকলে জ্বলবে) */}
        {!open && (
          <span className="absolute inset-0 rounded-xl bg-indigo-500 animate-ping opacity-20 pointer-events-none" />
        )}

        {/* আইকন রোটেশন ও স্মুথ ট্রানজিশন */}
        <div
          className={`transition-transform duration-300 ${open ? "rotate-90" : "rotate-0"}`}
        >
          {open ? <FaTimes size={18} /> : <FaHeadset size={18} />}
        </div>
      </button>
    </div>
  );
};

export default FloatingActionButton;
