import ClientUpload from "../app/components/ClientUpload";
import LoginButton from "./components/Login";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Smart Classroom",
  description: "An easy way to import classes onto Google Classroom",
  keywords: "Google Classroom, Smart Classroom, class importer",
  openGraph: {
    title: "Smart Classroom",
    description: "An easy way to import classes onto Google Classroom",
    images: [
      {
        url: "/Images/faviconseal.png",
        width: 1920,
        height: 1080,
        alt: "Smart Classroom Logo",
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b">
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
            <h1 className="text-lg font-semibold text-gray-900">
              Smart Classroom
            </h1>
          </div>
        </div>
      </header>

      {/* Centered Main Section */}
      <main className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col items-center space-y-6 mt-[-60px]">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome to Smart Classroom
          </h2>
          <p className="text-gray-500 text-center max-w-md">
            Streamline your Google Classroom setup with one click.
          </p>
          <LoginButton />
        </div>
      </main>
    </>
  );
}
