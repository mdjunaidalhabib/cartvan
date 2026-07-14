"use client";

import { useState } from "react";

/**
 * ✅ Small 1-click copy-to-clipboard button.
 * Used for TrxID / tracking IDs / anything admin needs to quickly copy.
 */
export default function CopyButton({ value, onCopied, className = "" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    if (!value || value === "—") return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // fallback for older/insecure contexts
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      setCopied(true);
      onCopied?.(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopied?.(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value || value === "—"}
      title="Copy"
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border transition shrink-0 ${
        copied
          ? "bg-green-50 text-green-600 border-green-200"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
      } disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
