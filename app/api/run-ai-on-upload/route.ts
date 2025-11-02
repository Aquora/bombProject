// app/api/run-ai-and-build/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";

const PYTHON_BIN = "python";          // bare python, as you requested
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

export async function POST(req: Request) {
  try {
    const { filename, aiScript = "backend/AiPrompt.py", buildScript = "backend/BuildClassroom.py", timeoutMs } =
      (await req.json()) as {
        filename: string;                    // e.g. "MySyllabus.pdf"
        aiScript?: string;                   // default: backend/AiPrompt.py
        buildScript?: string;                // default: backend/BuildClassroom.py
        timeoutMs?: number;
      };

    if (!isPlainFilename(filename) || !filename.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ ok: false, error: "filename must be a plain .pdf file name" }, { status: 400 });
    }

    const projectRoot   = process.cwd();
    const backendDir    = path.join(projectRoot, "backend");
    const uploadsDir    = path.join(backendDir, "uploads");
    const srcPdf        = path.join(uploadsDir, filename);            // original uploaded file
    const tempPdf       = path.join(uploadsDir, "file.pdf");          // what AiPrompt expects
    const jsonForName   = path.join(uploadsDir, filename.replace(/\.pdf$/i, ".json")); // if AI names by input
    const jsonDefault   = path.join(uploadsDir, "Syllabus.json");     // if AI writes a fixed name

    const aiScriptAbs   = path.join(projectRoot, aiScript);
    const buildScriptAbs= path.join(projectRoot, buildScript);

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
      const r = await runPython(PYTHON_BIN, [aiScriptAbs], { cwd: backendDir, timeoutMs });
      aiStdout = r.stdout; aiStderr = r.stderr; aiExit = r.exitCode;
      if (aiExit !== 0) {
        throw new Error(`AI script exited with ${aiExit}\n${aiStderr || aiStdout}`);
      }
    } finally {
      // Always remove the temp pdf
      await fs.unlink(tempPdf).catch(() => {});
    }

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

    
    const buildArgs = [buildScriptAbs, "--json", producedJson];
    const { stdout: buildStdout, stderr: buildStderr, exitCode: buildExit } =
      await runPython(PYTHON_BIN, buildArgs, { cwd: backendDir, timeoutMs });

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