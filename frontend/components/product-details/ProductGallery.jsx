import Image from "next/image";
import { optimizeCloudinaryUrl } from "../../lib/utils";

export default function ProductGallery({
  images,
  activeIdx,
  setActiveIdx,
  productName,
  isOutOfStock,
}) {
  return (
    <div className="bg-pink-50 rounded-xl">
      {/* ✅ aspect-[3/4] + object-contain: badhonsworld.com এর মতো full product দেখায়, crop হয় না */}
      <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-white group mx-auto">
        <Image
          src={optimizeCloudinaryUrl(images[activeIdx]) || "/no-image.png"}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-xl tracking-widest shadow-lg">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-2 justify-center overflow-x-auto no-scrollbar py-1">
          {images.map((src, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? "border-pink-600 ring-1 ring-pink-400"
                  : "border-transparent"
              }`}
            >
              <Image
                src={src}
                alt={`thumb-${i}`}
                fill
                sizes="56px"
                loading="lazy"
                className="object-contain p-0.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
