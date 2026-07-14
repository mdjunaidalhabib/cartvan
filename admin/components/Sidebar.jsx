"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

import MenuBar from "./MenuBar";
import { navItems, settingsChildren } from "./menuConfig";

export default function Sidebar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = Cookies.get("admin_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
        });
      } catch (err) {
        console.error("Token decode failed:", err);
      }
    }
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen p-4 bg-white shadow-lg overflow-hidden">
      {/* FULL HEIGHT menubar */}
      <div className="flex-1 flex flex-col min-h-0">
        <MenuBar
          items={navItems}
          settingsChildren={settingsChildren}
          vertical={true}
        />
      </div>
    </aside>
  );
}
