import React from "react";
import { FaShippingFast, FaShoppingBag, FaGift } from "react-icons/fa";

const OfferBar = () => {
  return (
    <div className="flex flex-nowrap justify-center items-center gap-1 md:gap-2 w-full px-1">
      {/* Free Delivery */}
      <div
        className="flex items-center gap-1 md:gap-1.5 bg-[#FFF5EE] 
        px-2 py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-1.5 rounded-md"
      >
        <div
          className="flex items-center justify-center 
          w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6
          rounded bg-gradient-to-br from-orange-400 to-red-500 text-white"
        >
          <FaShippingFast className="text-[10px] md:text-[12px] lg:text-[14px]" />
        </div>

        <span className="text-[11px] md:text-[13px] lg:text-[14px] font-medium whitespace-nowrap">
          Free Delivery
        </span>
      </div>

      {/* Best Discount */}
      <div
        className="flex items-center gap-1 md:gap-1.5 bg-[#F4F9FF] 
        px-2 py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-1.5 rounded-md"
      >
        <div
          className="flex items-center justify-center 
          w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6
          rounded bg-gradient-to-br from-blue-400 to-indigo-600 text-white"
        >
          <FaShoppingBag className="text-[10px] md:text-[12px] lg:text-[14px]" />
        </div>

        <span className="text-[11px] md:text-[13px] lg:text-[14px] font-medium whitespace-nowrap">
          Best Discount
        </span>
      </div>

      {/* Cartvan Box */}
      <div
        className="flex items-center gap-1 md:gap-1.5 bg-rose-50 
        px-2 py-1 md:px-2.5 md:py-1.5 lg:px-3 lg:py-1.5 rounded-md"
      >
        <div
          className="flex items-center justify-center 
          w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6
          rounded bg-gradient-to-br from-pink-400 to-rose-500 text-white"
        >
          <FaGift className="text-[10px] md:text-[12px] lg:text-[14px]" />
        </div>

        <span className="text-[11px] md:text-[13px] lg:text-[14px] font-medium whitespace-nowrap">
          Cartvan Box
        </span>
      </div>
    </div>
  );
};

export default OfferBar;
