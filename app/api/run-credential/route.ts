export const runtime = "nodejs";

import { spawn } from "node:child_process";
import path from "node:path";

const DEFAULT_TIMEOUT_MS = 30_000;

// ---------- internal runner ----------
function spawnOnce(
  cmd: string,
  args: string[],
  opts: { cwd: string; timeoutMs?: number; env?: NodeJS.ProcessEnv }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { cwd, timeoutMs = DEFAULT_TIMEOUT_MS, env = process.env } = opts;
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...env, PYTHONUNBUFFERED: "1" },
    });

    let out = "", err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);

    child.stdout.on("data", d => (out += d.toString()));
    child.stderr.on("data", d => (err += d.toString()));
    child.on("error", e => { clearTimeout(timer); reject(e); });
    child.on("close", code => {
      clearTimeout(timer);
      resolve({ stdout: out.trim(), stderr: err.trim(), exitCode: code ?? -1 });
    });
  });
}

// ---------- detect a Python 3 interpreter (tries env, py -3, python3, python) ----------
type PySpec = { cmd: string; args: string[]; label: string };

function candidateSpecs(): PySpec[] {
  const list: PySpec[] = [];
  const envBin = (process.env.PYTHON_BIN || "").trim();
  if (envBin) list.push({ cmd: envBin, args: [], label: `PYTHON_BIN=${envBin}` });

  if (process.platform === "win32") {
    list.push({ cmd: "py", args: ["-3"], label: "py -3" });
    list.push({ cmd: "python3", args: [], label: "python3" });
    list.push({ cmd: "python", args: [], label: "python" });
  } else {
    list.push({ cmd: "python3", args: [], label: "python3" });
    list.push({ cmd: "python", args: [], label: "python" });
    list.push({ cmd: "/usr/bin/env", args: ["python3"], label: "/usr/bin/env python3" });
  }
  return list;
}

async function detectPython3(cwd: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<PySpec | null> {
  for (const spec of candidateSpecs()) {
    try {
      const probe = await spawnOnce(
        spec.cmd,
        [...spec.args, "-c", "import sys; print(sys.version_info[0])"],
        { cwd, timeoutMs }
      );
      if (probe.exitCode === 0 && /^3/.test(probe.stdout)) return spec;
    } catch { /* try next */ }
  }
  return null;
}

// ---------- PUBLIC: run with detected Python 3 (backward-compatible signature) ----------
export async function runPython(
  cwd: string,
  scriptAbs: string,
  args: string[] = [],
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const py3 = await detectPython3(cwd, timeoutMs);
  if (py3) {
    return await spawnOnce(py3.cmd, [...py3.args, scriptAbs, ...args], { cwd, timeoutMs });
  }

  // Fallback: try python then python3 sequentially (in case detection failed)
  const fallbacks: PySpec[] = process.platform === "win32"
    ? [{ cmd: "python", args: [], label: "python" }, { cmd: "python3", args: [], label: "python3" }]
    : [{ cmd: "python", args: [], label: "python" }, { cmd: "python3", args: [], label: "python3" }];

  for (const f of fallbacks) {
    try {
      const r = await spawnOnce(f.cmd, [...f.args, scriptAbs, ...args], { cwd, timeoutMs });
      // accept the first successful execution
      if (r.exitCode === 0) return r;
    } catch { /* try next */ }
  }

  // Last resort: attempt 'python' and return whatever happens
  return await spawnOnce("python", [scriptAbs, ...args], { cwd, timeoutMs });
}

// ---------- OPTIONAL: run under BOTH python and python3 and return all results ----------
export async function runPythonBoth(
  cwd: string,
  scriptAbs: string,
  args: string[] = [],
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Array<{ label: string; stdout: string; stderr: string; exitCode: number }>> {
  const seen = new Set<string>();
  const specs: PySpec[] = [];

  // Always include plain python + python3 + py -3 (dedup by label)
  for (const s of [
    ...(process.platform === "win32"
      ? [{ cmd: "python", args: [], label: "python" }, { cmd: "py", args: ["-3"], label: "py -3" }, { cmd: "python3", args: [], label: "python3" }]
      : [{ cmd: "python", args: [], label: "python" }, { cmd: "python3", args: [], label: "python3" }]),
  ]) {
    if (!seen.has(s.label)) { specs.push(s); seen.add(s.label); }
  }

  const results: Array<{ label: string; stdout: string; stderr: string; exitCode: number }> = [];
  for (const s of specs) {
    try {
      const r = await spawnOnce(s.cmd, [...s.args, scriptAbs, ...args], { cwd, timeoutMs });
      results.push({ label: s.label, ...r });
    } catch (e: any) {
      results.push({ label: s.label, stdout: "", stderr: e?.message ?? String(e), exitCode: -1 });
    }
  }
  return results;
}