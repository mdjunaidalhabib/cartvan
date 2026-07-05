"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import cloudinaryLoader from "../../lib/cloudinaryLoader";
import Link from "next/link";
import axios from "axios";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ImageSliderSkeleton from "../skeletons/ImageSliderSkeleton";

export default function ImageSlider({
  images,
  autoPlayMs = 4000,

  // ✅ Daraz-style: same ratio for all devices (no mismatch)
  ratioClass = "aspect-[3/1]",

  showDots = true,
  showArrows = false,
  arrowsOnHover = true,
  swipeThresholdPx = 60,
}) {
  const API_BASE = "/api";

  const [slides, setSlides] = useState(images || []);
  const [loading, setLoading] = useState(!images);
  const [error, setError] = useState("");

  useEffect(() => {
    if (images) {
      setSlides(images);
      setLoading(false);
      return;
    }

    const loadSlides = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API_BASE}/slider-images`);
        setSlides(res.data?.slides || []);
      } catch (err) {
        console.error("Slider load error:", err);
        setError("Failed to load slider images");
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };

    loadSlides();
  }, [API_BASE, images]);

  const count = slides.length;
  const shouldShowSkeleton = loading || count === 0;

  const extended = useMemo(() => {
    return count > 1 ? [...slides, slides[0]] : slides;
  }, [slides, count]);

  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [enableTransition, setEnableTransition] = useState(true);

  useEffect(() => {
    if (!autoPlayMs || count <= 1) return;
    const id = setInterval(() => setIndex((i) => i + 1), autoPlayMs);
    return () => clearInterval(id);
  }, [autoPlayMs, count]);

  useEffect(() => {
    if (count > 1 && index === count) {
      const t = setTimeout(() => {
        setEnableTransition(false);
        setIndex(0);
        requestAnimationFrame(() => setEnableTransition(true));
      }, 450);
      return () => clearTimeout(t);
    }
  }, [index, count]);

  const shouldShowArrowsCalc =
    (showArrows || (arrowsOnHover && isHovered)) && count > 1;

  const activeDot = count > 1 ? (index === count ? 0 : index) : index;

  const trackRef = useRef(null);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);
  const deltaXRef = useRef(0);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    deltaXRef.current = 0;
    setEnableTransition(false);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    deltaXRef.current = e.clientX - startXRef.current;
    if (e.pointerType !== "mouse") e.preventDefault();
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    const dx = deltaXRef.current;
    draggingRef.current = false;
    setEnableTransition(true);

    if (Math.abs(dx) >= swipeThresholdPx) {
      if (dx < 0) setIndex((i) => i + 1);
      else setIndex((i) => (i > 0 ? i - 1 : 0));
    }

    deltaXRef.current = 0;
  };

  const baseTranslate = -(index * 100);
  const dragPercent = () => {
    if (!draggingRef.current) return 0;
    const el = trackRef.current;
    const width = el?.clientWidth || 1;
    return (deltaXRef.current / width) * 100;
  };

  const transform = `translateX(calc(${baseTranslate}% + ${dragPercent()}%))`;

  if (shouldShowSkeleton) {
    return <ImageSliderSkeleton ratioClass={ratioClass} showDots={false} />;
  }

  return (
    <section
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Image slider"
    >
      {/* ✅ Desktop max width 1080px */}
      <div className="mx-auto w-full max-w-full  md:max-w-[1024px] xl:max-w-[1536px] md:px-8 md:mt-2">
        {error && (
          <p className="text-center text-sm text-red-500 mb-2">{error}</p>
        )}

        <div className="relative overflow-hidden  bg-gray-100">
          <div
            ref={trackRef}
            className="flex w-full touch-pan-y select-none"
            style={{
              transform,
              transition: enableTransition ? "transform 450ms ease" : "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {extended.map((img, i) => {
              const isGhostDuplicate = count > 1 && i === count;
              const isPriority = i === 0 && !isGhostDuplicate;

              const imageEl = (
                <div className={`relative w-full ${ratioClass} bg-gray-100`}>
                  <Image
                    loader={cloudinaryLoader}
                    src={img.src}
                    alt={img.alt || "slide"}
                    fill
                    className="object-contain" // ✅ no crop
                    sizes="100vw"
                    priority={isPriority}
                  />
                </div>
              );

              return (
                <div key={i} className="w-full shrink-0">
                  {img.href ? (
                    <Link href={img.href} className="block">
                      {imageEl}
                    </Link>
                  ) : (
                    imageEl
                  )}
                </div>
              );
            })}
          </div>

          {/* ✅ dots overlay */}
          {showDots && count > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === activeDot ? "bg-blue-600 w-6" : "bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}

          {shouldShowArrowsCalc && (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => (i > 0 ? i - 1 : 0))}
                aria-label="Prev"
                className="hidden sm:grid absolute left-2 top-1/2 -translate-y-1/2 place-items-center w-9 h-9 rounded-full bg-white/80 backdrop-blur shadow hover:bg-white"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                aria-label="Next"
                className="hidden sm:grid absolute right-2 top-1/2 -translate-y-1/2 place-items-center w-9 h-9 rounded-full bg-white/80 backdrop-blur shadow hover:bg-white"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
