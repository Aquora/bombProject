// app/api/run-credential/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

const PYTHON_BIN = process.env.PYTHON_BIN || "python"; // or "python3"
const DEFAULT_TIMEOUT_MS = 30_000;

function runPython(cwd: string, scriptAbs: string, args: string[] = [], timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [scriptAbs, ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);

    child.stdout.on("data", d => (out += d.toString()));
    child.stderr.on("data", d => (err += d.toString()));
    child.on("error", e => { clearTimeout(timer); reject(e); });
    child.on("close", code => { clearTimeout(timer); resolve({ stdout: out.trim(), stderr: err.trim(), exitCode: code ?? -1 }); });
  });
}

export async function POST() {
  try {
    const projectRoot = process.cwd();
    const backendDir = path.join(projectRoot, "backend");
    const scriptPath = path.join(backendDir, "GetCredentials.py");

    const { stdout, stderr, exitCode } = await runPython(backendDir, scriptPath);

    if (exitCode !== 0) {
      return NextResponse.json({ ok: false, exitCode, stdout, stderr }, { status: 500 });
    }

    let data: any = null;

    return NextResponse.json({ ok: true, exitCode, stdout, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}