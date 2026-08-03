"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import cloudinaryLoader from "../../lib/cloudinaryLoader";

const HomepagePopup = () => {
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/homepage-popup")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) =>
        console.error("❌ Failed to load homepage popup config", err),
      );
  }, []);

  useEffect(() => {
    if (!config?.enabled || !config?.image) return;

    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [config]);

  if (!config?.enabled || !config?.image || !visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
      onClick={() => setVisible(false)}
    >
      <div
        className="relative w-full max-w-sm md:max-w-lg lg:max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setVisible(false)}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-20 bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="relative aspect-square rounded-lg overflow-hidden shadow-2xl bg-white">
          <Image
            loader={cloudinaryLoader}
            src={config.image}
            alt="Promotion"
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 1024px) 512px, 576px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default HomepagePopup;
