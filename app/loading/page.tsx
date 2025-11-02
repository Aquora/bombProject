"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Loading() {
  // Message sequence with durations (in milliseconds)
  const messages = [
    { text: "Importing your syllabus...", duration: 5000 },
    { text: "Reviewing and organizing information...", duration: 10000 },
    { text: "Designing assignments...", duration: 10000 },
    { text: "Scheduling due dates...", duration: 10000 },
    { text: "Preparing learning materials...", duration: 10000 },
    { text: "Finalizing your Google Classroom setup...", duration: Infinity },
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (currentMessageIndex < messages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentMessageIndex((prev) => prev + 1);
      }, messages[currentMessageIndex].duration);
      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex]);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-300">
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
            <h1 className="text-lg text-gray-800 font-semibold">Smart Classroom</h1>
          </div>
        </div>
      </header>

      {/* Full-page transparent white overlay */}
      <main className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center">
          {/* Spinner */}
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-gray-300 border-t-gray-800 animate-spin" />

          {/* Dynamic Message */}
          <p className="mt-6 text-lg font-medium text-gray-800 max-w-md mx-auto">
            {messages[currentMessageIndex].text}
          </p>
        </div>
      </main>
    </>
  );
}
