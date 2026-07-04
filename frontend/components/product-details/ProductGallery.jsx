import Image from "next/image";
import cloudinaryLoader from "../../lib/cloudinaryLoader";

export default function ProductGallery({
  images,
  activeIdx,
  setActiveIdx,
  productName,
  isOutOfStock,
}) {
  return (
    <div className="bg-pink-50 rounded-xl p-2">
      {/* Main Image */}
      <div className="relative w-full max-w-[520px] sm:max-w-[560px] md:max-w-[580px] mx-auto aspect-square rounded-xl overflow-hidden bg-white shadow-sm">
        <Image
          loader={cloudinaryLoader}
          src={images[activeIdx] || "/no-image.png"}
          alt={productName}
          fill
          priority
          sizes="(max-width:768px) 100vw, (max-width:1280px) 60vw, 55vw"
          className="object-contain object-center p-0 transition-transform duration-300 hover:scale-105"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-xl tracking-widest shadow-lg">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? "border-pink-600 ring-2 ring-pink-300"
                  : "border-gray-200 hover:border-pink-400"
              }`}
            >
              <Image
                loader={cloudinaryLoader}
                src={src || "/no-image.png"}
                alt={`${productName}-${i}`}
                fill
                loading="lazy"
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
