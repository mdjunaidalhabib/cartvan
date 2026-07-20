"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  Info,
  Loader2,
  Tag,
  X,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  showPromoField: true,
  showAvailabilityMessage: true,
  hasAvailablePromo: true,
  message: "Promo code থাকলে এখানে ব্যবহার করে discount নিন।",
};

export default function PromoCodeBox({
  items,
  userId,
  phone,
  paymentMethod,
  onPromoChange,
  disabled = false,
}) {
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;

    fetch("/api/promos/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Promo settings load failed");
        return response.json();
      })
      .then((data) => {
        if (active) setSettings({ ...DEFAULT_SETTINGS, ...data });
      })
      .catch(() => {
        // Keep backward compatibility if the settings endpoint is temporarily
        // unavailable: the promo field remains usable instead of disappearing.
        if (active) setSettings(DEFAULT_SETTINGS);
      });

    return () => {
      active = false;
    };
  }, []);

  const itemSignature = useMemo(
    () =>
      JSON.stringify(
        (Array.isArray(items) ? items : []).map(
          ({ productId, qty, color }) => ({
            productId,
            qty,
            color: color || null,
          }),
        ),
      ),
    [items],
  );

  const validateCode = async (rawCode, { silent = false } = {}) => {
    const normalized = String(rawCode || "").trim().toUpperCase();
    if (!normalized) {
      setError("Promo code লিখুন।");
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      setError("Cart-এ product নেই।");
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    if (!silent) setError("");

    try {
      const response = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          items: items.map(({ productId, qty, color }) => ({
            productId,
            qty,
            color: color || null,
          })),
          userId: userId || null,
          phone: phone || "",
          paymentMethod: paymentMethod || "cod",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Promo apply করা যায়নি।");
      }
      if (currentRequest !== requestId.current) return;

      setCode(normalized);
      setAppliedCode(normalized);
      setResult(data);
      setError("");
      onPromoChange?.(data);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setResult(null);
      setAppliedCode("");
      setError(err?.message || "Promo apply করা যায়নি।");
      onPromoChange?.(null);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const removePromo = () => {
    requestId.current += 1;
    setAppliedCode("");
    setResult(null);
    setError("");
    onPromoChange?.(null);
  };

  useEffect(() => {
    if (!appliedCode) return;
    const timer = setTimeout(() => {
      validateCode(appliedCode, { silent: true });
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSignature, paymentMethod, phone, userId, appliedCode]);

  // Wait for the server setting before rendering so an admin-disabled field
  // never flashes briefly on the checkout page.
  if (!settings) return null;
  if (settings.showPromoField === false) return null;

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
          <BadgePercent size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800">Promo code</p>
          {settings.showAvailabilityMessage !== false && settings.message && (
            <p
              className={`mt-0.5 flex items-start gap-1 text-[11px] leading-4 ${
                settings.hasAvailablePromo
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              <Info size={12} className="mt-0.5 shrink-0" />
              <span>{settings.message}</span>
            </p>
          )}
        </div>
      </div>

      {result && appliedCode ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-2">
              <CheckCircle2
                className="mt-0.5 shrink-0 text-green-600"
                size={18}
              />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-green-800">
                  {result.promo?.code} applied
                </p>
                <p className="break-words text-[11px] text-green-700">
                  {result.promo?.title ||
                    "Promo discount applied successfully"}
                </p>
                <p className="mt-1 text-xs font-bold text-green-700">
                  আপনি সেভ করছেন ৳
                  {Number(result.discountAmount || 0) +
                    Number(result.shippingDiscount || 0)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removePromo}
              className="shrink-0 rounded-full p-1 text-green-700 hover:bg-green-100"
              aria-label="Remove promo code"
            >
              <X size={16} />
            </button>
          </div>
          {loading && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-green-600">
              <Loader2 size={11} className="animate-spin" /> Rechecking
              promo…
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100">
            <span className="flex items-center pl-3 text-gray-400">
              <Tag size={15} />
            </span>
            <input
              type="text"
              value={code}
              disabled={disabled || loading}
              onChange={(event) => {
                setCode(
                  event.target.value.toUpperCase().replace(/\s+/g, ""),
                );
                if (error) setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  validateCode(code);
                }
              }}
              placeholder="Enter promo code"
              className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-800 outline-none placeholder:font-medium placeholder:normal-case placeholder:tracking-normal"
            />
            <button
              type="button"
              disabled={disabled || loading || !code.trim()}
              onClick={() => validateCode(code)}
              className="min-w-[68px] shrink-0 bg-pink-600 px-2 text-xs font-bold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300 sm:min-w-[78px] sm:px-3"
            >
              {loading ? (
                <Loader2 size={16} className="mx-auto animate-spin" />
              ) : (
                "Apply"
              )}
            </button>
          </div>
          {error && (
            <p className="mt-1.5 break-words text-[11px] font-medium text-red-500">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
