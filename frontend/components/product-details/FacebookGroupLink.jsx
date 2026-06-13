import React from "react";
import { FaFacebookF } from "react-icons/fa";

const FacebookGroupLink = () => {
  return (
    <div className="flex items-center gap-1 md:gap-2 ">
      {/* Icon */}
      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#1877F2] hover:bg-[#166FE5] transition flex items-center justify-center">
        <FaFacebookF className="text-white text-sm" />
      </div>

      {/* Text */}
      <a
        href="https://www.facebook.com/share/g/18mbUSQjdp/?mibextid=wwXIfr"
        target="_blank"
        rel="noreferrer"
        className="text-xs md:text-sm text-gray-900 hover:underline"
      >
        Visit our Facebook group{" "}
        <span className="text-pink-500 font-semibold">Cartvan Family</span>
      </a>
    </div>
  );
};

export default FacebookGroupLink;
