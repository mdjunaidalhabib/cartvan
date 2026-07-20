"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaCheck,
  FaCopy,
  FaEnvelope,
  FaFacebookF,
  FaShareAlt,
  FaTelegramPlane,
  FaWhatsapp,
  FaTwitter,
} from "react-icons/fa";


const buildShareLinks = (url, text) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return [
    {
      label: "Facebook",
      icon: FaFacebookF,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      iconClass: "bg-blue-600 text-white",
    },
    {
      label: "WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      iconClass: "bg-green-500 text-white",
    },
    {
      label: "Telegram",
      icon: FaTelegramPlane,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      iconClass: "bg-sky-500 text-white",
    },
    {
      label: "X",
      icon: FaTwitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      iconClass: "bg-black text-white",
    },
    {
      label: "Email",
      icon: FaEnvelope,
      href: `mailto:?subject=${encodedText}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
      iconClass: "bg-gray-600 text-white",
    },
  ];
};

export default function ShareProduct({ productName = "Check out this product" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);
  const wrapperRef = useRef(null);
  const copiedTimerRef = useRef(null);

  const getShareData = () => {
    const title = productName || "Check out this product";
    const text = `Check out ${title}`;

    return { url: shareUrl, title, text };
  };

  useEffect(() => {
    setShareUrl(window.location.href);
    setSupportsNativeShare(typeof navigator.share === "function");

    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const copyTextFallback = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const handleCopy = async () => {
    const { url } = getShareData();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        copyTextFallback(url);
      }

      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Unable to copy product link:", error);
      copyTextFallback(url);
      setCopied(true);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    try {
      await navigator.share(getShareData());
      setIsOpen(false);
    } catch (error) {
      // AbortError means the user closed the native share sheet.
      if (error?.name !== "AbortError") {
        console.error("Unable to share product:", error);
      }
    }
  };

  const { url, text } = getShareData();
  const shareLinks = buildShareLinks(url, text);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Share this product"
        aria-expanded={isOpen}
        className={`rounded-full p-1 md:p-3 shadow-sm md:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 ${
          isOpen
            ? "bg-pink-600 text-white"
            : "bg-white text-gray-500 hover:bg-pink-50 hover:text-pink-600"
        }`}
      >
        <FaShareAlt className="text-sm md:text-base" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-[100] mt-2 max-h-[70vh] w-64 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-pink-100 bg-white shadow-2xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-gray-800">Share product</p>
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {productName}
            </p>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-700 transition hover:bg-pink-50"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-pink-100 text-pink-600"
                }`}
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </span>
              <span>{copied ? "Link copied!" : "Copy product link"}</span>
            </button>

            {supportsNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-700 transition hover:bg-pink-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FaShareAlt />
                </span>
                <span>More sharing options</span>
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 p-3">
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Share via
            </p>

            <div className="grid grid-cols-5 gap-2">
              {shareLinks.map(({ label, icon: Icon, href, iconClass }) => (
                <a
                  key={label}
                  href={href}
                  target={label === "Email" ? undefined : "_blank"}
                  rel={label === "Email" ? undefined : "noopener noreferrer"}
                  onClick={() => setIsOpen(false)}
                  aria-label={`Share on ${label}`}
                  title={label}
                  className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition hover:bg-gray-50"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm shadow-sm transition-transform group-hover:scale-105 ${iconClass}`}
                  >
                    <Icon />
                  </span>
                  <span className="max-w-full truncate text-[9px] font-semibold text-gray-500">
                    {label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
