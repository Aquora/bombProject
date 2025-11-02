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
      className="inline-flex items-center justify-center gap-2 rounded-full 
                 bg-green-400 text-white font-semibold px-6 py-2 text-sm 
                 shadow-md transition-all duration-200
                 hover:bg-green-500 active:scale-[0.97]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
                 disabled:opacity-60"
    >
      {busy ? "Loading..." : label}
    </button>
  );
}
