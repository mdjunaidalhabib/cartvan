"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  LifeBuoy,
  Mail,
  Phone,
  Clock,
  Quote,
  ChevronDown,
  MessageCircleHeart,
} from "lucide-react";
import {
  FaFacebookF,
  FaUsers,
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaLinkedinIn,
  FaPinterest,
  FaSnapchatGhost,
  FaWhatsapp,
  FaTelegram,
} from "react-icons/fa";
import cloudinaryLoader from "../../../lib/cloudinaryLoader";

// ✅ ফুটারের সোশ্যাল আইকন ম্যাপের সাথে সামঞ্জস্যপূর্ণ (একই platform key ব্যবহার হয়)
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

function SocialLinks({ links, className = "" }) {
  const valid = (links || []).filter((l) => l?.url && SOCIAL_ICON_MAP[l.platform]);
  if (valid.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {valid.map((l, idx) => {
        const Icon = SOCIAL_ICON_MAP[l.platform];
        return (
          <a
            key={idx}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl bg-pink-500 hover:bg-pink-600 text-white transition-all duration-300 flex items-center justify-center hover:-translate-y-1"
          >
            <Icon className="text-base" />
          </a>
        );
      })}
    </div>
  );
}

function SupportSkeleton() {
  return (
    <div className="bg-pink-50 animate-pulse">
      <div className="max-w-5xl mx-auto px-6 py-20 space-y-6">
        <div className="h-10 w-1/2 bg-pink-200 rounded mx-auto" />
        <div className="h-4 w-2/3 bg-pink-100 rounded mx-auto" />
        <div className="h-48 bg-white rounded-3xl" />
      </div>
    </div>
  );
}

function AccordionItem({ heading, content, isOpen, onToggle }) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all overflow-hidden ${
        isOpen ? "border-pink-300 shadow-md" : "border-slate-100"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
      >
        <h3 className="font-bold text-slate-900">{heading}</h3>
        <ChevronDown
          size={20}
          className={`shrink-0 text-pink-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-slate-600 leading-8 whitespace-pre-line">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const res = await fetch("/api/support", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load support data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Support Error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  if (loading) return <SupportSkeleton />;
  if (!data) return null;

  const {
    pageTitle,
    intro,
    supportEmail = "",
    supportPhone = "",
    workingHours = "",
    team = [],
    sections = [],
  } = data;

  const [spotlight, ...restTeam] = team;

  return (
    <div className="bg-pink-50 min-h-screen">
      {/* Founder / CEO spotlight */}
      {spotlight && (
        <section className="max-w-5xl mx-auto px-6 pt-10 pb-6">
          <div className="relative bg-gradient-to-br from-white to-pink-50 rounded-[32px] border border-pink-100 shadow-sm p-8 md:p-12 overflow-hidden">
            <Quote className="absolute top-6 right-6 text-pink-100" size={80} />
            <div className="relative grid md:grid-cols-[auto_1fr] gap-8 items-center">
              <div className="mx-auto md:mx-0 w-32 h-32 md:w-40 md:h-40 rounded-full bg-pink-200 ring-4 ring-white shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                {spotlight.photo ? (
                  <Image
                    loader={cloudinaryLoader}
                    src={spotlight.photo}
                    alt={spotlight.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-pink-500">
                    {spotlight.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-center md:text-left">
                {spotlight.title && (
                  <span className="inline-block text-xs font-bold tracking-wider uppercase text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                    {spotlight.title}
                  </span>
                )}
                <h2 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
                  {spotlight.name}
                </h2>
                {spotlight.bio && (
                  <p className="mt-4 text-slate-600 leading-8">{spotlight.bio}</p>
                )}
                {(spotlight.email || spotlight.phone) && (
                  <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                    {spotlight.email && (
                      <a
                        href={`mailto:${spotlight.email}`}
                        className="flex items-center gap-1.5 text-slate-600 hover:text-pink-500 transition-colors"
                      >
                        <Mail size={15} /> {spotlight.email}
                      </a>
                    )}
                    {spotlight.phone && (
                      <a
                        href={`tel:${spotlight.phone}`}
                        className="flex items-center gap-1.5 text-slate-600 hover:text-pink-500 transition-colors"
                      >
                        <Phone size={15} /> {spotlight.phone}
                      </a>
                    )}
                  </div>
                )}
                <SocialLinks
                  links={spotlight.socialLinks}
                  className="mt-5 justify-center md:justify-start"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pink-100 via-pink-50 to-transparent">
        <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -right-10 w-80 h-80 bg-rose-300/30 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-lg shadow-pink-200 flex items-center justify-center">
            <LifeBuoy className="text-pink-500" size={28} />
          </div>
          <h1 className="mt-6 text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          {intro && (
            <p className="mt-5 text-slate-600 leading-8 max-w-2xl mx-auto text-base md:text-lg">
              {intro}
            </p>
          )}
        </div>
      </section>

      {/* Quick contact strip */}
      {(supportEmail || supportPhone || workingHours) && (
        <section className="max-w-5xl mx-auto px-6 -mt-6 relative z-10">
          <div className="grid sm:grid-cols-3 gap-4">
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                  <Mail className="text-pink-500 group-hover:text-white transition-colors" size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    ইমেইল করুন
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800 break-all">
                    {supportEmail}
                  </p>
                </div>
              </a>
            )}
            {supportPhone && (
              <a
                href={`tel:${supportPhone}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                  <Phone className="text-pink-500 group-hover:text-white transition-colors" size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    কল করুন
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {supportPhone}
                  </p>
                </div>
              </a>
            )}
            {workingHours && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                  <Clock className="text-pink-500" size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    কর্মঘণ্টা
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {workingHours}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Rest of the team */}
      {restTeam.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 text-center mb-10">
            আমাদের টিম
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restTeam.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 text-center"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-pink-200 overflow-hidden flex items-center justify-center ring-4 ring-pink-50">
                  {member.photo ? (
                    <Image
                      loader={cloudinaryLoader}
                      src={member.photo}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-pink-500">
                      {member.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{member.name}</h3>
                {member.title && (
                  <p className="text-sm text-pink-600 font-medium">{member.title}</p>
                )}
                {member.bio && (
                  <p className="mt-3 text-sm text-slate-600 leading-6">{member.bio}</p>
                )}
                {(member.email || member.phone) && (
                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="block hover:text-pink-500 break-all">
                        {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="block hover:text-pink-500">
                        {member.phone}
                      </a>
                    )}
                  </div>
                )}
                <SocialLinks links={member.socialLinks} className="mt-3 justify-center" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sections — accordion */}
      {sections.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-16">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 text-center mb-8">
            সচরাচর জিজ্ঞাসা
          </h2>
          <div className="space-y-4">
            {sections.map((section, index) => (
              <AccordionItem
                key={index}
                heading={section.heading}
                content={section.content}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex((cur) => (cur === index ? -1 : index))}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto rounded-[32px] bg-white border border-pink-100 p-10 md:p-14 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-100 flex items-center justify-center">
            <MessageCircleHeart className="text-pink-500" size={26} />
          </div>
          <h2 className="mt-5 text-2xl md:text-3xl font-bold text-slate-900">
            আরও সাহায্য দরকার?
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            আমাদের টিম সবসময় আপনার পাশে আছে — নির্দ্বিধায় যোগাযোগ করুন।
          </p>
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-block mt-7 bg-pink-500 text-white px-8 py-3.5 rounded-xl font-semibold shadow-sm hover:bg-pink-600 transition-colors duration-300"
            >
              যোগাযোগ করুন
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
