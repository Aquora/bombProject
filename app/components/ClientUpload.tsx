"use client";

import { useState } from "react";
import FileDropCenter from "./FileDropCenter";
import { useRouter } from "next/navigation";


type RunStatus = "uploading" | "processing" | "done" | "error";

export default function ClientUpload() {
  const router = useRouter();
  const AI_SCRIPT = "backend/AiPrompt.py";

  const [runs, setRuns] = useState<
    Array<{ filename: string; status: RunStatus; message?: string }>
  >([]);

  const onFiles = async (files: File[]) => {
    if (!files?.length) return;

    router.push("/loading");
    setRuns(files.map((f) => ({ filename: f.name, status: "uploading" })));

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();

      const filenames = extractServerFilenames(data);
      if (!filenames.length) throw new Error("No filenames returned from upload.");

      for (const name of filenames) {
        updateRun(name, "processing", "running AI…");
        const runRes = await fetch("/api/run-ai-on-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: name,          // plain filename, e.g. "mySyllabus.pdf"
            script: AI_SCRIPT,       // path relative to project root
          }),
        });

        const runData = await runRes.json().catch(() => ({}));
        if (runRes.ok && runData?.ok) {
          updateRun(name, "done", runData.stdout ?? "OK");
        } else {
          updateRun(name, "error", runData?.error ?? `Run failed (${runRes.status})`);
        }
        router.push("/import");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? String(err));
    }
  };

  return (
    <>
      <FileDropCenter accept="application/pdf" multiple onFiles={onFiles} />
      <ul className="mt-4 space-y-2 text-sm">
        {runs.map((r) => (
          <li key={r.filename}>
            <strong>{r.filename}</strong> — {r.status}
            {r.message ? `: ${r.message}` : ""}
          </li>
        ))}
      </ul>
    </>
  );

  // ------- helpers -------
  function extractServerFilenames(data: any): string[] {
    if (Array.isArray(data?.files)) {
      return data.files
        .map((x: any) => x?.filename || basename(x?.relativePath) || basename(x?.diskPath))
        .filter(Boolean);
    }
    if (Array.isArray(data?.urls)) {
      return data.urls.map((u: string) => basename(u)).filter(Boolean);
    }
    return [];
  }

  function basename(p?: string): string {
    if (!p) return "";
    const s = p.split("?")[0]; 
    return s.slice(s.lastIndexOf("/") + 1);
  }

  function updateRun(filename: string, status: RunStatus, message?: string) {
    setRuns((prev) => {
      const i = prev.findIndex((r) => r.filename === filename);
      const next = [...prev];
      if (i >= 0) next[i] = { ...next[i], status, message };
      else next.push({ filename, status, message });
      return next;
    });
  }
}