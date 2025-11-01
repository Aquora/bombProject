// app/components/ClientUpload.tsx
"use client";

import FileDropCenter from "./FileDropCenter";

export default function ClientUpload() {
  const onFiles = async (files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const { urls } = await res.json();
    console.log("Stored at:", urls); // e.g. /uploads/123-myfile.png
  };

  return <FileDropCenter accept="image/*,application/pdf" multiple onFiles={onFiles} />;
}