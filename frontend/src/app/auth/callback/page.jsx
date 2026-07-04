"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../../../context/UserContext";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchMe } = useUser();

  useEffect(() => {
    const token = searchParams.get("token");
    let redirect = searchParams.get("redirect") || "/";

    // ✅ Safety net: redirect যেন কখনো ভিন্ন origin এ না নিয়ে যায় —
    // তাহলে এই page যেই domain এ token সেভ করলো, router.replace সেই একই
    // domain এর মধ্যেই থাকবে, আর localStorage-এর token হারাবে না।
    if (/^https?:\/\//i.test(redirect)) {
      try {
        const parsed = new URL(redirect);
        redirect = parsed.pathname + parsed.search;
      } catch {
        redirect = "/";
      }
    }

    if (token) {
      // ✅ token localStorage এ save করো
      localStorage.setItem("token", token);

      // ✅ fetchMe শেষ হওয়ার পর redirect করো (race condition fix)
      fetchMe(token).then(() => {
        router.replace(redirect);
      });
    } else {
      router.replace("/");
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-center text-gray-600">⏳ Logging in...</p>
    </div>
  );
}
