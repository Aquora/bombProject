"use client";

import { useRef, useState } from "react";

type Props = {
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
};

export default function FileDropCenter({
  accept = "*",
  multiple = false,
  onFiles,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    onFiles?.(Array.from(list));
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`w-[min(92vw,720px)] border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer ${
          isDragging ? "border-blue-500 ring-4 ring-blue-100" : "border-neutral-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />
        <h2 className="text-xl text-white font-semibold">Import your Syllabus</h2>
        <p className="text-sm text-white">Drag & drop or click to browse</p>
      </div>
    </div>
  );
}