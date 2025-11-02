import LoginButton from "../components/Login";
import { Metadata } from "next";
import Image from "next/image";

export default function Loading() {
  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur border-b">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/SmartClassroomLogo.png" 
                  alt="Smart Classroom"
                  width={40}
                  height={40}
                  priority
                  className="rounded-md"
                />
                <h1 className="text-lg text-white font-semibold">Smart Classroom</h1>
              </div>
              <LoginButton />
            </div>
          </header>

      <main className="mx-auto max-w-6xl px-4 pt-24 pb-12">
        <div className="fixed inset-0 grid place-items-center bg-black/60">
        <div className="rounded-xl bg-white p-6 shadow">
        <div className="mx-auto h-10 w-10 rounded-full border-4 border-gray-300 border-t-gray-900 animate-spin" />
        <p className="mt-3 text-sm text-gray-600">Loading…</p>
        </div>
        </div>
      </main>
    </>
  );
}