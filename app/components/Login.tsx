"use client";
import { MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";


type Props = { label?: string; onClick?: (e: MouseEvent<HTMLButtonElement>) => void };

export default function LoginButtonClient({ label = "Log in", onClick }: Props) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  

  const defaultClick = async (e: MouseEvent<HTMLButtonElement>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/run-credential", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || json?.stderr || `HTTP ${res.status}`);
      console.log("stdout:", json.stdout);
    } catch (err: any) {
      alert(`Script failed: ${err.message || String(err)}`);
    } finally {
      setBusy(false);
      router.push("/import")
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