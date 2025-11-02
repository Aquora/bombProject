// app/layout.tsx
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Classroom",
  description: "An easy way to import classes onto Google Classroom",
  keywords: "Smart Classroom, Google Classroom, import classes",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
