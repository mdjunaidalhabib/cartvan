"use client";

import React, { useState, useEffect } from "react";
import { FaFacebookF } from "react-icons/fa";

const FacebookGroupLink = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch("/api/facebook-group")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) =>
        console.error("❌ Failed to load facebook group settings", err),
      );
  }, []);

  // ডেটা না আসা পর্যন্ত, disabled থাকলে, বা লিংক সেট না থাকলে কিছু দেখাবে না
  if (!config || !config.enabled || !config.link) return null;

  return (
    <div className="flex items-center gap-1 md:gap-2 ">
      {/* Icon */}
      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#1877F2] hover:bg-[#166FE5] transition flex items-center justify-center">
        <FaFacebookF className="text-white text-sm" />
      </div>

      {/* Text */}
      <a
        href={config.link}
        target="_blank"
        rel="noreferrer"
        className="text-xs md:text-sm text-gray-900 hover:underline"
      >
        Visit our Facebook group{" "}
        <span className="text-pink-500 font-semibold">{config.name}</span>
      </a>
    </div>
  );
};

export default FacebookGroupLink;
