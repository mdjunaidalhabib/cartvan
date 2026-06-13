import React from "react";
import { FaShippingFast, FaShoppingBag, FaGift } from "react-icons/fa";

const OfferBar = () => {
  return (
    // justify-center এবং একদম অল্প gap ব্যবহার করা হয়েছে যেন সব স্ক্রিনে ১ লাইনে ধরে
    <div className="flex flex-nowrap justify-center items-center gap-1 w-full px-1">
      {/* Free Delivery */}
      <div className="flex items-center gap-1 bg-[#FFF5EE] px-1.5 py-0.5 rounded-md">
        <div className="flex items-center justify-center w-4 h-4 shrink-0 rounded bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-xs">
          <FaShippingFast className="text-[9px]" />
        </div>
        <span className="text-[10px] text-gray-900 font-medium whitespace-nowrap">
          Free Delivery
        </span>
      </div>

      {/* Best Discount */}
      <div className="flex items-center gap-1 bg-[#F4F9FF] px-1.5 py-0.5 rounded-md">
        <div className="flex items-center justify-center w-4 h-4 shrink-0 rounded bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xs">
          <FaShoppingBag className="text-[9px]" />
        </div>
        <span className="text-[10px] text-gray-900 font-medium whitespace-nowrap">
          Best Discount
        </span>
      </div>

      {/* Cartva Box */}
      <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded-md">
        <div className="flex items-center justify-center w-4 h-4 shrink-0 rounded bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-xs">
          <FaGift className="text-[9px]" />
        </div>
        <span className="text-[10px] text-gray-900 font-medium whitespace-nowrap">
          Cartva Box
        </span>
      </div>
    </div>
  );
};

export default OfferBar;
