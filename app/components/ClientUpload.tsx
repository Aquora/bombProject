"use client";

import { useState } from "react";
import FileDropCenter from "./FileDropCenter";

type RunStatus = "uploading" | "processing" | "done" | "error";

export default function ClientUpload() {
  // 👇 set this to your script’s path relative to project root
  // e.g. "scripts/generate_syllabus_json.py" or "backend/ai.py"
  const AI_SCRIPT = "backend/AiPrompt.py";

  const [runs, setRuns] = useState<
    Array<{ filename: string; status: RunStatus; message?: string }>
  >([]);

  const onFiles = async (files: File[]) => {
    if (!files?.length) return;

    // show initial state
    setRuns(files.map((f) => ({ filename: f.name, status: "uploading" })));

    try {
      // 1) Upload the files
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();

      // 2) Determine server-side filenames we need to pass to run-ai-on-upload
      const filenames = extractServerFilenames(data);
      if (!filenames.length) throw new Error("No filenames returned from upload.");

      // 3) For each uploaded file, run the AI script
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
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? String(err));
    }
  };

  // Accept **PDFs only** (you said all imports are PDF)
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
    // New route shape: { ok: true, files: [{ filename, relativePath, diskPath }] }
    if (Array.isArray(data?.files)) {
      return data.files
        .map((x: any) => x?.filename || basename(x?.relativePath) || basename(x?.diskPath))
        .filter(Boolean);
    }
    // Old route shape: { urls: ["uploads/foo.pdf"] } or ["/uploads/foo.pdf"]
    if (Array.isArray(data?.urls)) {
      return data.urls.map((u: string) => basename(u)).filter(Boolean);
    }
    return [];
  }

  function basename(p?: string): string {
    if (!p) return "";
    const s = p.split("?")[0]; // strip query if any
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