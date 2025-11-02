"use client";

import { useState } from "react";
import Image from "next/image";
import LoginButton from "./components/Login";

export default function Page() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/Images/faviconseal.png"
              alt="Smart Classroom"
              width={40}
              height={40}
              priority
              className="rounded-md"
            />
            <h1 className="text-lg text-white font-semibold">Smart Classroom</h1>
          </div>

          {!showLogin && (
            <LoginButton label="Log in" onClick={() => setShowLogin(true)} />
          )}
        </div>
      </header>

      <main className="pt-24">
        {!showLogin ? (
          <div className="text-center mt-10">
            <h2 className="text-3xl font-semibold">Welcome to Smart Classroom</h2>
            <p className="text-gray-600 mt-2">
              Easily import and manage your Google Classroom content.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Log in to Smart Classroom
              </h2>

              <form className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Email"
                  className="border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700 transition"
                >
                  Log In
                </button>
              </form>

              <button
                onClick={() => setShowLogin(false)}
                className="text-blue-600 text-sm block text-center mt-4 hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
