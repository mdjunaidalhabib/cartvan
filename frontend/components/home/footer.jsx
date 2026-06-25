"use client";

import Link from "next/link";
import Image from "next/image";
import FooterSkeleton from "../skeletons/FooterSkeleton";
import { useEffect, useState } from "react";
import {
  FaFacebookF,
  FaUsers,
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaUserCircle,
  FaTwitter,
  FaLinkedinIn,
  FaPinterest,
  FaSnapchatGhost,
  FaWhatsapp,
  FaTelegram,
  FaCcVisa,
  FaCcMastercard,
  FaCcApplePay,
  FaCcPaypal,
} from "react-icons/fa";

const quickLinksData = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "All Categories", href: "/categories" },
  { label: "About Our Story", href: "/about" },
];

const customerServiceLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
];

const SOCIAL_ICON_MAP = {
  facebook: FaFacebookF,
  facebook_group: FaUsers,
  youtube: FaYoutube,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  twitter: FaTwitter,
  linkedin: FaLinkedinIn,
  pinterest: FaPinterest,
  snapchat: FaSnapchatGhost,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
};

export default function Footer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch("/api/footer", {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to load footer data");

        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Footer Error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  if (loading) return <FooterSkeleton />;
  if (!data) return null;

  const { brand = {}, contact = {}, socialLinks = [] } = data;

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-zinc-950 to-neutral-950 text-slate-300 pt-16 pb-6 px-4 md:px-12 mb-14 md:mb-0 border-t border-zinc-800/60 font-sans tracking-wide">
      <div className="mx-auto max-w-7xl">
        {/* Main Grid Section — ৪টি কলামকেই সমান ভাগ (lg:grid-cols-4) করা হয়েছে */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12">
          {/* Column 1: Brand Info */}
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              {brand.logo && !imgError ? (
                <Image
                  src={brand.logo}
                  alt={brand?.title || "Brand Logo"}
                  width={45}
                  height={45}
                  className="rounded-xl object-cover ring-2 ring-pink-500/30"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <FaUserCircle className="text-xl text-white" />
                </div>
              )}
              <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-pink-200 bg-clip-text text-transparent">
                {brand.title || "BrandName"}
              </h2>
            </div>

            <p className="text-sm leading-6 text-zinc-400">
              {brand.about ||
                "Elevating your premium lifestyle shopping experience with high-quality products curated just for you."}
            </p>

            {/* Social Icons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {socialLinks
                .filter((s) => s.url)
                .map((social, idx) => {
                  const Icon = SOCIAL_ICON_MAP[social.platform];
                  if (!Icon) return null;

                  return (
                    <Link
                      key={idx}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-xl bg-zinc-900/80 hover:bg-pink-600 border border-zinc-800 hover:border-pink-500 text-zinc-400 hover:text-white transition-all duration-300 flex items-center justify-center hover:-translate-y-1 backdrop-blur-sm"
                    >
                      <Icon className="text-base" />
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* Column 2: Explore Links */}
          <div className="lg:pl-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-pink-500 pl-3">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              {quickLinksData.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="text-zinc-400 hover:text-pink-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-1.5 bg-pink-400 rounded-full mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="lg:pl-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-pink-500 pl-3">
              Support
            </h3>
            <ul className="space-y-2.5 text-sm">
              {customerServiceLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="text-zinc-400 hover:text-pink-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-1.5 bg-pink-400 rounded-full mr-0 group-hover:mr-2 transition-all duration-200"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-pink-500 pl-3">
              Contact Us
            </h3>
            <ul className="space-y-3.5 text-sm text-zinc-400">
              {contact.phone && (
                <li className="flex items-center gap-2.5">
                  <FaPhoneAlt className="text-pink-500 text-base shrink-0" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="hover:text-white transition truncate"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.website && (
                <li className="flex items-center gap-2.5">
                  <FaGlobe className="text-pink-500 text-base shrink-0" />
                  <a
                    href={
                      contact.website.startsWith("http")
                        ? contact.website
                        : `https://${contact.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition truncate"
                  >
                    {contact.website}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center gap-2.5">
                  <FaEnvelope className="text-pink-500 text-base shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-white transition truncate"
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-2.5">
                  <FaMapMarkerAlt className="text-pink-500 shrink-0 mt-1 text-base" />
                  <span className="leading-5">{contact.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Dynamic Decorative Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent my-6" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 items-center justify-between gap-4 text-xs text-zinc-500">
          {/* Copyright */}
          <p className="text-center sm:text-left order-2 sm:order-1">
            © {new Date().getFullYear()}{" "}
            <span className="text-zinc-400 font-medium">
              {brand.title || "Company"}
            </span>
            . All Rights Reserved.
          </p>

          {/* Payment Gateways */}
          <div className="flex items-center justify-center gap-3 text-2xl text-zinc-600 order-1 sm:order-2 bg-zinc-900/40 px-4 py-1.5 rounded-full border border-zinc-800/30 backdrop-blur-sm">
            <FaCcVisa className="hover:text-slate-300 transition" />
            <FaCcMastercard className="hover:text-slate-300 transition" />
          </div>

          {/* Developer Credit */}
          <p className="text-center sm:text-right order-3">
            Crafted by{" "}
            <a
              href="https://hikmahit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-pink-400 font-semibold transition-colors "
            >
              Hikmah IT
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
