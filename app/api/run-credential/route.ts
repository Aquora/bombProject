
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { spawn } from "node:child_process";

import path from "node:path";

const PYTHON_BIN = process.env.PYTHON_BIN || "python"; 
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

