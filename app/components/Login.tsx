"use client";
import { MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  label?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  successHref?: string; // where to go on success
  failureHref?: string; // where to go on failure
};

export default function LoginButtonClient({
  label = "Log in",
  onClick,
  successHref = "/import",
  failureHref = "/error",
}: Props) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const defaultClick = async (e: MouseEvent<HTMLButtonElement>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/run-credential", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || json?.stderr || `HTTP ${res.status}`);
      }

      // ✅ success: navigate
      router.push(`${successHref}?ok=1&ts=${Date.now()}`);
    } catch (err: any) {
      // ❌ failure: navigate
      router.push(
        `${failureHref}?err=${encodeURIComponent(err?.message || "Script failed")}`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick ?? defaultClick}
      disabled={busy}
        className="relative inline-flex items-center justify-center gap-3 rounded-full 
              bg-gradient-to-r from-green-300 to-green-600 text-white font-bold 
              px-10 py-4 text-xl shadow-[0_8px_20px_rgba(72,187,120,0.4)] 
              hover:from-green-500 hover:to-green-700 hover:shadow-[0_10px_25px_rgba(72,187,120,0.5)]
              active:scale-[0.97] transition-all duration-200 ease-in-out
              focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400 focus-visible:ring-offset-2
              disabled:opacity-60"

    >
      {busy ? "Loading..." : label}
    </button>
  );
}
