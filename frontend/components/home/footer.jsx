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
} from "react-icons/fa";

const quickLinksData = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Categories", href: "/categories" },
];

// Icon map — key must match platform values in DB
// ⚠️ Admin panel এ এই map দরকার নেই — শুধু frontend এ
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
        const footerRes = await fetch("/api/footer", {
          signal: controller.signal,
        });

        if (!footerRes.ok) {
          throw new Error(`Footer API failed: ${footerRes.status}`);
        }

        const footerJson = await footerRes.json();
        setData(footerJson);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Failed to load footer", err);
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
    <footer className="bg-pink-100 text-gray-900 pt-10 pb-2 px-4 md:px-12 mb-14 md:mb-0">
      <div className="mx-auto w-full md:max-w-[680px] lg:max-w-[768px] xl:max-w-[1080px] 2xl:max-w-[1280px] grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            {brand.logo && !imgError ? (
              <Image
                src={brand.logo}
                alt={brand?.title || "Brand Logo"}
                width={40}
                height={40}
                loading="lazy"
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-pink-50 rounded-lg">
                <FaUserCircle className="text-gray-400 w-6 h-6" />
              </div>
            )}

            <span className="text-xl font-bold text-pink-600 block min-w-[100px] truncate">
              {brand.title || "Your business name"}
            </span>
          </div>

          <p className="text-sm mb-4">
            {brand.about || "Your business destination."}
          </p>

          {/* Dynamic social links — icon react-icons থেকে */}
          <div className="flex gap-4 text-xl flex-wrap">
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
                  >
                    <Icon className="hover:text-pink-600" />
                  </Link>
                );
              })}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            {quickLinksData.map((item, i) => (
              <li key={i}>
                <Link href={item.href} className="hover:text-pink-600">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <ul className="space-y-2 text-sm">
            {contact.address && (
              <li className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <a
                  href="https://maps.app.goo.gl/Qvc2AX1ELx5JCaWY9?g_st=ipc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-600"
                >
                  {contact.address}
                </a>
              </li>
            )}

            {contact.email && (
              <li className="flex items-center gap-2">
                <FaEnvelope />
                <a href={`mailto:${contact.email}`} className="hover:text-pink-600">
                  {contact.email}
                </a>
              </li>
            )}

            {contact.phone && (
              <li className="flex items-center gap-2">
                <FaPhoneAlt />
                <a href={`tel:${contact.phone}`} className="hover:text-pink-600">
                  {contact.phone}
                </a>
              </li>
            )}

            {contact.website && (
              <li className="flex items-center gap-2">
                <FaGlobe />
                <a
                  href={
                    contact.website.startsWith("http")
                      ? contact.website
                      : `https://${contact.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-600"
                >
                  {contact.website}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <hr className="border-t border-gray-400 mt-6" />

      <div className="my-1 text-center text-xs text-gray-700 px-2 whitespace-normal break-words sm:whitespace-nowrap sm:overflow-hidden sm:text-ellipsis">
        <span className="block sm:inline">
          © {new Date().getFullYear()} All Rights Reserved {brand.title}
        </span>

        <span className="hidden sm:inline mx-1 text-gray-400">•</span>

        <span className="block sm:inline text-gray-600">
          Developed by{" "}
          <a
            href="https://hikmahit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-pink-600 hover:underline underline-offset-4"
          >
            Hikmah IT
          </a>
        </span>
      </div>
    </footer>
  );
}
