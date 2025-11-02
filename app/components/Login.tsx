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
      // ❌ failure: navigate (or keep alert if you prefer)
      router.push(`${failureHref}?err=${encodeURIComponent(err?.message || "Script failed")}`);
      // or: alert(`Script failed: ${err?.message || String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick ?? defaultClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur
                 transition hover:bg-white active:scale-[0.98]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {busy ? "Running…" : label}
    </button>
  );
}