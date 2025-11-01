"use client";
import { MouseEvent } from "react";
// import { signIn } from "next-auth/react";

type Props = { label?: string; onClick?: (e: MouseEvent<HTMLButtonElement>) => void };

export default function LoginButtonClient({ label = "Log in", onClick }: Props) {
  return (
    <button
      onClick={onClick /* or () => signIn() */}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/80 px-4 py-2 text-sm text-black font-medium shadow-sm backdrop-blur
                 transition hover:bg-white active:scale-[0.98]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {label}
    </button>
  );
}