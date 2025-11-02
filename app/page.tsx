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
      {/* ================= HEADER ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/Images/faviconseal.png"
              alt="Smart Classroom"
              width={45}
              height={45}
              priority
              className="rounded-md shadow-sm"
            />
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Smart Classroom
            </h1>
          </div>
        </div>
      </header>

      {/* ================= HERO + HOW IT WORKS ================= */}
      <main className="bg-white min-h-screen text-gray-800 pt-32 pb-24">
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center max-w-3xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900">
            Welcome to{" "}
            <span className="text-green-500">
              Smart Classroom
            </span>
          </h2>

          <p className="text-gray-600 text-lg md:text-xl max-w-2xl leading-relaxed mt-4">
            Automatically build your Google Classroom from any syllabus.
            <br className="hidden md:block" />
            Save time — let Smart Classroom handle assignments, due dates, and setup for you.
          </p>

          <div className="mt-6">
            <LoginButton />
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section
          id="how-it-works"
          className="mt-32 max-w-5xl mx-auto px-6 text-center"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900">
            How It Works
          </h3>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow-sm">
                <span className="text-green-600 text-2xl font-bold">1</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">
                Upload Your Syllabus
              </h4>
              <p className="text-gray-600">
                Drop in your syllabus (PDF) and let Smart
                Classroom do the rest.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow-sm">
                <span className="text-green-600 text-2xl font-bold">2</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">
                AI Processes It
              </h4>
              <p className="text-gray-600">
                Smart Classroom scans and organizes topics, dates, and materials
                with AI precision.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow-sm">
                <span className="text-green-600 text-2xl font-bold">3</span>
              </div>
              <h4 className="font-semibold text-lg mb-2 text-gray-900">
                Have a Complete Template
              </h4>
              <p className="text-gray-600">
                Our system automatically builds a fully structured Google Classroom, ready to use immediately.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
