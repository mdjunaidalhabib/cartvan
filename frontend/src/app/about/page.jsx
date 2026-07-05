"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Truck,
  Headphones,
  RefreshCw,
  Target,
  Eye,
  Award,
  Star,
  Heart,
  Users,
  Clock,
  ThumbsUp,
} from "lucide-react";

// ✅ Admin panel এ icon টি string (e.g. "shield-check") হিসেবে সেভ থাকে,
// এখানে সেটাকে আসল lucide component এ map করা হচ্ছে।
const ICON_MAP = {
  "shield-check": ShieldCheck,
  truck: Truck,
  headphones: Headphones,
  "refresh-cw": RefreshCw,
  target: Target,
  eye: Eye,
  award: Award,
  star: Star,
  heart: Heart,
  users: Users,
  clock: Clock,
  "thumbs-up": ThumbsUp,
};

function AboutSkeleton() {
  return (
    <div className="bg-pink-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="h-6 w-40 bg-pink-200 rounded-full mx-auto" />
        <div className="h-12 w-2/3 bg-pink-200 rounded mx-auto" />
        <div className="h-4 w-1/2 bg-pink-100 rounded mx-auto" />
      </div>
    </div>
  );
}

export default function AboutPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch("/api/about", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load about data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ About Error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  if (loading) return <AboutSkeleton />;
  if (!data) return null;

  const {
    hero = {},
    storeName = "",
    story = {},
    stats = [],
    mission = {},
    vision = {},
    featuresSection = {},
    features = [],
    cta = {},
  } = data;

  return (
    <div className="bg-pink-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-pink-100">
        <div className="relative max-w-7xl mx-auto px-6 py-8 lg:py-32">
          <div className="max-w-4xl mx-auto text-center ">
            {hero.badge && (
              <span className="inline-flex items-center rounded-full border border-pink-300 px-4 py-2 text-sm text-indigo-600">
                {hero.badge}
              </span>
            )}

            <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
              {hero.titleLine1}
              <span className="block">{hero.titleLine2}</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl leading-relaxed">
              {hero.description}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={hero.primaryButtonLink || "/products"}
                className="bg-pink-500 text-indigo-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {hero.primaryButtonText || "এখনই শপ করুন"}
              </Link>

              {hero.secondaryButtonText && (
                <a
                  href="#mission"
                  className="border border-pink-300 px-8 py-4 rounded-xl font-semibold  hover:bg-white/10 transition"
                >
                  {hero.secondaryButtonText}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About / Story */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {story.subtitle && (
            <span className="text-indigo-600 font-semibold uppercase tracking-wider">
              {story.subtitle}
            </span>
          )}

          <h2 className="text-4xl font-bold text-slate-900 mt-3 mb-6">
            {story.heading}
          </h2>

          <p className="text-lg text-slate-600 leading-8">
            {storeName} {story.paragraph1}
          </p>

          {story.paragraph2 && (
            <p className="mt-6 text-lg text-slate-600 leading-8">
              {story.paragraph2}
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item, index) => (
              <div
                key={index}
                className="bg-pink-100 rounded-3xl p-8 text-center shadow-sm border border-slate-100"
              >
                <h3 className="text-4xl font-bold text-indigo-600">
                  {item.value}
                </h3>
                <p className="mt-2 text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      <section
        id="mission"
        className="bg-pink-100 py-20 border-y border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-pink-100 border">
              <div className="w-16 h-16 rounded-2xl bg-pink-300 flex items-center justify-center">
                <Target className="text-pink-600" size={28} />
              </div>

              <h3 className="text-2xl font-bold mt-6 mb-4">{mission.title}</h3>

              <p className="text-slate-600 leading-8">{mission.description}</p>
            </div>

            <div className="p-8 rounded-3xl bg-pink-100 border">
              <div className="w-16 h-16 rounded-2xl bg-pink-300 flex items-center justify-center">
                <Eye className="text-pink-600" size={28} />
              </div>

              <h3 className="text-2xl font-bold mt-6 mb-4">{vision.title}</h3>

              <p className="text-slate-600 leading-8">{vision.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            {featuresSection.subtitle && (
              <span className="text-indigo-600 font-semibold uppercase">
                {featuresSection.subtitle}
              </span>
            )}

            <h2 className="text-4xl font-bold mt-3">
              {featuresSection.heading}
            </h2>

            {featuresSection.description && (
              <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                {featuresSection.description}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {features.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon] || Star;

              return (
                <div
                  key={index}
                  className="bg-pink-100 p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-pink-300 flex items-center justify-center">
                    <Icon className="text-indigo-600" size={26} />
                  </div>

                  <h3 className="font-bold text-lg mt-6 mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-slate-600 leading-7">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto rounded-[32px] bg-pink-100 p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold">{cta.title}</h2>

          {cta.description && (
            <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
              {cta.description}
            </p>
          )}

          <Link
            href={cta.buttonLink || "/products"}
            className="inline-block mt-8 bg-pink-500 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
          >
            {cta.buttonText || "এখনই শপ করুন"}
          </Link>
        </div>
      </section>
    </div>
  );
}
