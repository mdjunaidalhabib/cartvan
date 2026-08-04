"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, CalendarClock } from "lucide-react";

function PrivacyPolicySkeleton() {
  return (
    <div className="bg-pink-50 min-h-screen animate-pulse">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
        <div className="h-8 w-1/2 bg-pink-200 rounded mx-auto" />
        <div className="h-4 w-2/3 bg-pink-100 rounded mx-auto" />
        <div className="h-px w-full bg-pink-100 mt-10" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 pt-6">
            <div className="h-5 w-1/3 bg-pink-200 rounded" />
            <div className="h-3 w-full bg-pink-100 rounded" />
            <div className="h-3 w-5/6 bg-pink-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch("/api/privacy-policy", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load privacy policy data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Privacy Policy Error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  if (loading) return <PrivacyPolicySkeleton />;
  if (!data) return null;

  const { pageTitle, intro, effectiveDate, sections = [] } = data;

  return (
    <div className="bg-pink-50 min-h-screen">
      {/* Header */}
      <header className="border-b border-pink-100">
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-pink-100 flex items-center justify-center">
            <ShieldCheck className="text-pink-500" size={24} />
          </div>
          <h1 className="mt-5 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          {intro && (
            <p className="mt-4 text-slate-500 leading-7 max-w-xl mx-auto text-sm md:text-base">
              {intro}
            </p>
          )}
          {effectiveDate && (
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarClock size={14} />
              সর্বশেষ হালনাগাদ: {effectiveDate}
            </div>
          )}
        </div>
      </header>

      {/* Sections */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        {sections.map((section, index) => (
          <div
            key={index}
            className={index !== 0 ? "mt-10 pt-10 border-t border-pink-100" : ""}
          >
            <div className="flex items-start gap-3">
              <span className="text-xs font-semibold text-pink-600 bg-pink-100 rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-slate-900">
                  {section.heading}
                </h2>
                {(section.points || []).length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {section.points.map((point, i) => (
                      <li key={i} className="flex gap-3 text-slate-600 leading-7">
                        <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-pink-300 shrink-0" />
                        <span className="whitespace-pre-line">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
