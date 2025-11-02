import ClientUpload from "../app/components/ClientUpload";
import LoginButton from "./components/Login";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Smart Classroom",
  description:
    "A easy way to import classes onto google classroom",
  keywords:
    "A easy way to import classes onto google classroom",
  openGraph: {
    title: "Smart Classroom",
    description:
      "A easy way to import classes onto google classroom",
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
          <LoginButton />
        </div>
      </header>

      <main>
      </main>
    </>
  ); 
}