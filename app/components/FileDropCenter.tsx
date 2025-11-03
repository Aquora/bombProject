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
    <div className="flex justify-center w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer 
          ${
            isDragging
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-linear-to-r from-green-50 to-white hover:from-green-100 hover:to-white"
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
        <h2 className="text-lg font-semibold text-green-600">
          Import your Syllabus
        </h2>
        <p className="text-sm text-gray-500">
          Drag & drop or click to browse
        </p>
      </div>
    </div>
  );
}
