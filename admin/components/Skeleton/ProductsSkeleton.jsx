"use client";

export default function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -450px 0;
          }
          100% {
            background-position: 450px 0;
          }
        }
        .shimmer {
          background: linear-gradient(
            to right,
            #f0f0f0 8%,
            #ffffff 18%,
            #f0f0f0 33%
          );
          background-size: 800px 104px;
          animation: shimmer 1.3s linear infinite;
        }
      `}</style>

      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border border-gray-200 bg-white rounded-2xl p-4 shadow-sm space-y-3"
        >
          <div className="w-full h-40 shimmer rounded-lg"></div>
          <div className="w-3/4 h-4 shimmer rounded"></div>
          <div className="w-1/2 h-4 shimmer rounded"></div>
          <div className="flex justify-between mt-2">
            <div className="w-16 h-6 shimmer rounded"></div>
            <div className="w-16 h-6 shimmer rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
