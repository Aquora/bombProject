// app/api/run-ai-on-upload/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

const DEFAULT_TIMEOUT_MS = 90_000;
const PYTHON_BIN = 'python'; // set to absolute path if needed

function isPlainFilename(name: string) {
  return !!name && name === path.basename(name);
}

async function findExisting(paths: string[]) {
  for (const p of paths) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { filename, script, timeoutMs } = (await req.json()) as {
      filename: string;      // e.g. "mySyllabus.pdf"
      script: string;        // e.g. "backend/AiPrompt.py"
      timeoutMs?: number;
    };

    if (!isPlainFilename(filename) || !filename.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ ok: false, error: 'filename must be a plain .pdf file name' }, { status: 400 });
    }
    if (!script) {
      return NextResponse.json({ ok: false, error: 'Provide script path, e.g. "backend/AiPrompt.py"' }, { status: 400 });
    }

    const projectRoot = process.cwd();
    const backendDir = path.join(projectRoot, 'backend');
    const uploadsBackend = path.join(backendDir, 'uploads');
    const uploadsPublic = path.join(projectRoot, 'public', 'uploads');

    // Locate the uploaded file regardless of which upload dir you're using
    const candidates = [
      path.join(uploadsBackend, filename),
      path.join(uploadsPublic, filename),
    ];
    const src = await findExisting(candidates);
    if (!src) {
      return NextResponse.json(
        { ok: false, error: `Uploaded file "${filename}" not found in: ${candidates.join(' , ')}` },
        { status: 404 }
      );
    }

    // Ensure backend/uploads exists, then map the file to what your script expects: uploads/file.pdf
    await fs.mkdir(uploadsBackend, { recursive: true });
    const dst = path.join(uploadsBackend, 'file.pdf');
    // Clear any prior file then link or copy
    await fs.rm(dst, { force: true }).catch(() => {});
    try {
      // Try hard-link (fast, same device); fall back to copy if it fails
      await fs.link(src, dst);
    } catch {
      await fs.copyFile(src, dst);
    }

    // Verify your script exists
    const scriptPath = path.join(projectRoot, script);
    await fs.access(scriptPath).catch(() => {
      throw new Error(`Python script not found: ${scriptPath}`);
    });

    // Spawn Python with CWD=backend so "uploads/file.pdf" resolves correctly
    const runTimeout = typeof timeoutMs === 'number' ? timeoutMs : DEFAULT_TIMEOUT_MS;
    const { stdout, stderr, exitCode } = await new Promise<{
      stdout: string; stderr: string; exitCode: number;
    }>((resolve, reject) => {
      const child = spawn(PYTHON_BIN, [scriptPath], {
        cwd: backendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      });

      let out = '';
      let err = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
      }, runTimeout);

      child.stdout.on('data', (d) => (out += d.toString()));
      child.stderr.on('data', (d) => (err += d.toString()));
      child.on('error', (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout: out.trim(), stderr: err.trim(), exitCode: code ?? -1 });
      });
    });

    return NextResponse.json({
      ok: exitCode === 0,
      ran: script,
      input: 'backend/uploads/file.pdf',
      output: 'backend/uploads/Syllabus.json',
      exitCode,
      stdout,
      stderr,
      note:
        exitCode === 0
          ? undefined
          : 'Check stderr for missing Python, missing packages, or script errors.',
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}