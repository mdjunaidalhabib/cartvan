"use client";
import React, { useState } from "react";
import {
  FaPhoneAlt,
  FaWhatsapp,
  FaFacebookMessenger,
  FaTimes,
  FaRegCommentDots,
} from "react-icons/fa";

const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);

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
        {/* ফোন আইকন */}
        <a
          href="tel:+8801975579365"
          className={`bg-green-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
            open ? "animate-bounce delay-100" : ""
          }`}
        >
          <FaPhoneAlt size={22} />
        </a>

        {/* WhatsApp আইকন */}
        <a
          href="https://wa.me/8801975579365"
          target="_blank"
          rel="noopener noreferrer"
          className={`bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
            open ? "animate-bounce delay-200" : ""
          }`}
        >
          <FaWhatsapp size={22} />
        </a>

        {/* Messenger আইকন */}
        <a
          href="https://www.facebook.com/openupbd"
          target="_blank"
          rel="noopener noreferrer"
          className={`bg-[#0084FF] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
            open ? "animate-bounce delay-300" : ""
          }`}
        >
          <FaFacebookMessenger size={22} />
        </a>
      </div>

      {/* মূল বাটন */}
      {/* মূল বাটন */}
      <button
        onClick={() => setOpen(!open)}
        className={`bg-pink-600 text-white p-3 rounded-full shadow-xl hover:bg-pink-700 
    transition-all duration-300 flex items-center justify-center transform-gpu z-[9999]
    active:scale-95
    ${open ? "scale-105 shadow-2xl" : "scale-100"}
  `}
      >
        {/* Pulse Ring */}
        <span
          className={`absolute w-12 h-12 rounded-full bg-pink-500/40 animate-ping 
      ${open ? "hidden" : "block"}
    `}
        />

        {/* Icon animation */}
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
