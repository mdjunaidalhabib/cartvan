import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Headphones,
  RefreshCw,
  Target,
  Eye,
} from "lucide-react";

export default function AboutPage() {
  const storeName = "আপনার স্টোরের নাম";

  const stats = [
    { value: "10K+", label: "সন্তুষ্ট গ্রাহক" },
    { value: "5K+", label: "পণ্য" },
    { value: "50+", label: "ব্র্যান্ড" },
    { value: "24/7", label: "সাপোর্ট" },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: "আসল পণ্যের নিশ্চয়তা",
      description: "প্রতিটি পণ্য যাচাই-বাছাই করে সরবরাহ করা হয়।",
    },
    {
      icon: Truck,
      title: "দ্রুত ডেলিভারি",
      description: "সারা দেশে দ্রুত ও নিরাপদ ডেলিভারি সেবা।",
    },
    {
      icon: RefreshCw,
      title: "সহজ রিটার্ন",
      description: "নির্দিষ্ট শর্তে সহজ রিটার্ন ও রিফান্ড সুবিধা।",
    },
    {
      icon: Headphones,
      title: "গ্রাহক সাপোর্ট",
      description: "যেকোনো সমস্যায় আমাদের টিম সর্বদা প্রস্তুত।",
    },
  ];

  return (
    <div className="bg-pink-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-pink-100">
        <div className="relative max-w-7xl mx-auto px-6 py-8 lg:py-32">
          <div className="max-w-4xl mx-auto text-center ">
            <span className="inline-flex items-center rounded-full border border-pink-300 px-4 py-2 text-sm text-indigo-600">
              ✨ আমাদের সম্পর্কে
            </span>

            <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-tight">
              আপনার বিশ্বস্ত
              <span className="block">অনলাইন শপিং সঙ্গী</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl leading-relaxed">
              আমরা বিশ্বাস করি অনলাইন শপিং হওয়া উচিত সহজ, নিরাপদ এবং
              আনন্দদায়ক। তাই আমরা মানসম্মত পণ্য, দ্রুত ডেলিভারি এবং অসাধারণ
              গ্রাহক সেবা নিশ্চিত করি।
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/products"
                className="bg-pink-500 text-indigo-600 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                এখনই শপ করুন
              </Link>

              <a
                href="#mission"
                className="border border-pink-300 px-8 py-4 rounded-xl font-semibold  hover:bg-white/10 transition"
              >
                আরও জানুন
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-indigo-600 font-semibold uppercase tracking-wider">
            Our Story
          </span>

          <h2 className="text-4xl font-bold text-slate-900 mt-3 mb-6">
            আমরা কারা?
          </h2>

          <p className="text-lg text-slate-600 leading-8">
            {storeName} একটি আধুনিক ই-কমার্স প্ল্যাটফর্ম যেখানে গ্রাহকরা সহজেই
            তাদের প্রয়োজনীয় পণ্য খুঁজে পান। আমরা ফ্যাশন, ইলেকট্রনিক্স, হোম &
            লিভিং, বিউটি এবং আরও অনেক ক্যাটাগরির পণ্য সরবরাহ করি।
          </p>

          <p className="mt-6 text-lg text-slate-600 leading-8">
            আমাদের লক্ষ্য শুধুমাত্র পণ্য বিক্রি করা নয়, বরং একটি বিশ্বস্ত
            সম্পর্ক তৈরি করা যেখানে প্রতিটি গ্রাহক আত্মবিশ্বাসের সাথে কেনাকাটা
            করতে পারেন।
          </p>
        </div>
      </section>

      {/* Stats */}
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

              <h3 className="text-2xl font-bold mt-6 mb-4">আমাদের লক্ষ্য</h3>

              <p className="text-slate-600 leading-8">
                গ্রাহকদের জন্য সর্বোচ্চ মানের পণ্য, প্রতিযোগিতামূলক মূল্য এবং
                দ্রুত ডেলিভারি নিশ্চিত করা।
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-pink-100 border">
              <div className="w-16 h-16 rounded-2xl bg-pink-300 flex items-center justify-center">
                <Eye className="text-pink-600" size={28} />
              </div>

              <h3 className="text-2xl font-bold mt-6 mb-4">আমাদের ভিশন</h3>

              <p className="text-slate-600 leading-8">
                বাংলাদেশের অন্যতম সেরা ও সবচেয়ে বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম
                হিসেবে প্রতিষ্ঠিত হওয়া।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <span className="text-indigo-600 font-semibold uppercase">
            Why Choose Us
          </span>

          <h2 className="text-4xl font-bold mt-3">কেন আমাদের বেছে নেবেন?</h2>

          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            আমরা শুধুমাত্র একটি অনলাইন স্টোর নই, আমরা আপনার নির্ভরযোগ্য শপিং
            পার্টনার।
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="bg-pink-100 p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-pink-300 flex items-center justify-center">
                  <Icon className="text-indigo-600" size={26} />
                </div>

                <h3 className="font-bold text-lg mt-6 mb-3">{feature.title}</h3>

                <p className="text-slate-600 leading-7">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto rounded-[32px] bg-pink-100 p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold">
            আপনার পছন্দের পণ্য খুঁজে নিন
          </h2>

          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            হাজারো পণ্যের সংগ্রহ থেকে আজই আপনার প্রয়োজনীয় পণ্যটি অর্ডার করুন।
          </p>

          <Link
            href="/products"
            className="inline-block mt-8 bg-pink-500 px-8 py-4 rounded-xl font-semibold hover:scale-105 transition"
          >
            এখনই শপ করুন
          </Link>
        </div>
      </section>
    </div>
  );
}

