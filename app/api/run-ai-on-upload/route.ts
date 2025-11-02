// app/api/run-ai-and-build/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";

const DEFAULT_TIMEOUT_MS = 90_000;

function isPlainFilename(name: string) {
  return !!name && name === path.basename(name);
}

async function fileExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

function runPython(cmd: string, args: string[], opts: { cwd: string; timeoutMs?: number; env?: NodeJS.ProcessEnv }) {
  const { cwd, timeoutMs = DEFAULT_TIMEOUT_MS, env = process.env } = opts;
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...env, PYTHONUNBUFFERED: "1" } });

    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ stdout: out.trim(), stderr: err.trim(), exitCode: code ?? -1 }); });
  });
}

// ---- NEW: detect a Python 3 interpreter (tries python, python3, py -3, etc.) ----
type PySpec = { cmd: string; args: string[] };

async function detectPython(cwd: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<PySpec> {
  const candidates: PySpec[] = [];

  const envBin = (process.env.PYTHON_BIN || "").trim();
  if (envBin) candidates.push({ cmd: envBin, args: [] });

  if (process.platform === "win32") {
    candidates.push({ cmd: "py", args: ["-3"] });
    candidates.push({ cmd: "python", args: [] });
    candidates.push({ cmd: "python3", args: [] });
  } else {
    candidates.push({ cmd: "python", args: [] });
    candidates.push({ cmd: "python3", args: [] });
    // env fallback
    candidates.push({ cmd: "/usr/bin/env", args: ["python3"] });
  }

  for (const spec of candidates) {
    try {
      const probe = await runPython(
        spec.cmd,
        [...spec.args, "-c", "import sys; print(sys.version_info[0])"],
        { cwd, timeoutMs }
      );
      if (probe.exitCode === 0 && probe.stdout.startsWith("3")) {
        return spec; // success: Python 3
      }
    } catch {
      // ignore ENOENT / spawn errors; try next candidate
    }
  }

  // Fallback to something reasonable (won't pass the probe but avoids undefined)
  return candidates[0] ?? { cmd: "python", args: [] };
}

export async function POST(req: Request) {
  try {
    const { filename, aiScript = "backend/AiPrompt.py", buildScript = "backend/BuildClassroom.py", timeoutMs } =
      (await req.json()) as {
        filename: string;
        aiScript?: string;
        buildScript?: string;
        timeoutMs?: number;
      };

    if (!isPlainFilename(filename) || !filename.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ ok: false, error: "filename must be a plain .pdf file name" }, { status: 400 });
    }

    const projectRoot   = process.cwd();
    const backendDir    = path.join(projectRoot, "backend");
    const uploadsDir    = path.join(backendDir, "uploads");
    const srcPdf        = path.join(uploadsDir, filename);
    const tempPdf       = path.join(uploadsDir, "file.pdf");
    const jsonForName   = path.join(uploadsDir, filename.replace(/\.pdf$/i, ".json"));
    const jsonDefault   = path.join(uploadsDir, "Syllabus.json");

    const aiScriptAbs   = path.join(projectRoot, aiScript);
    const buildScriptAbs= path.join(projectRoot, buildScript);

    // ---- pick Python 3 first
    const py = await detectPython(backendDir, timeoutMs ?? DEFAULT_TIMEOUT_MS);

    // Validate presence
    if (!(await fileExists(srcPdf))) {
      return NextResponse.json({ ok: false, error: `Uploaded file not found at ${srcPdf}` }, { status: 404 });
    }
    if (!(await fileExists(aiScriptAbs))) {
      return NextResponse.json({ ok: false, error: `AI script not found at ${aiScriptAbs}` }, { status: 404 });
    }
    if (!(await fileExists(buildScriptAbs))) {
      return NextResponse.json({ ok: false, error: `Build script not found at ${buildScriptAbs}` }, { status: 404 });
    }

    // Prepare temp input for AI
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.copyFile(srcPdf, tempPdf);

    // --- Step 1: run AI to create JSON ---
    let aiStdout = "", aiStderr = "", aiExit = -1;
    try {
      const r = await runPython(py.cmd, [...py.args, aiScriptAbs], { cwd: backendDir, timeoutMs });
      aiStdout = r.stdout; aiStderr = r.stderr; aiExit = r.exitCode;
      if (aiExit !== 0) throw new Error(`AI script exited with ${aiExit}\n${aiStderr || aiStdout}`);
    } finally {
      await fs.unlink(tempPdf).catch(() => {});
    }

    // Determine produced JSON
    const producedJson = (await fileExists(jsonForName)) ? jsonForName
                        : (await fileExists(jsonDefault)) ? jsonDefault
                        : null;

    if (!producedJson) {
      return NextResponse.json({
        ok: false,
        error: `AI finished but JSON file not found. Looked for:\n- ${jsonForName}\n- ${jsonDefault}`,
        ai: { exitCode: aiExit, stdout: aiStdout, stderr: aiStderr },
      }, { status: 500 });
    }

    // --- Step 2: Build Classroom ---
    const { stdout: buildStdout, stderr: buildStderr, exitCode: buildExit } =
      await runPython(py.cmd, [...py.args, buildScriptAbs, "--json", producedJson], { cwd: backendDir, timeoutMs });

    if (buildExit !== 0) {
      return NextResponse.json({
        ok: false,
        error: `Build script exited with ${buildExit}`,
        ai: { exitCode: aiExit, stdout: aiStdout, stderr: aiStderr, json: producedJson },
        build: { exitCode: buildExit, stdout: buildStdout, stderr: buildStderr },
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      inputPdf: srcPdf,
      json: producedJson,
      ai:    { exitCode: aiExit, stdout: aiStdout, stderr: aiStderr },
      build: { exitCode: buildExit, stdout: buildStdout, stderr: buildStderr },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}