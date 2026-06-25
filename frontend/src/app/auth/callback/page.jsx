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
    const redirect = searchParams.get("redirect") || "/";

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
