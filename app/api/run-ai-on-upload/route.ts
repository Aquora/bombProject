// app/api/run-ai-on-upload/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';

const PYTHON_BIN = 'python';

export async function POST(req: Request) {
  try {
    const { filename, script } = (await req.json()) as {
      filename: string;
      script: string;
    };


    const projectRoot = process.cwd();
    const backendDir  = path.join(projectRoot, 'backend');
    const uploadsDir  = path.join(backendDir, 'uploads');
    const src         = path.join(uploadsDir, filename);
    const dst         = path.join(uploadsDir, 'file.pdf'); // what your script expects

    await fs.access(src).catch(() => { throw new Error(`Uploaded file not found at ${src}`); });
    await fs.access(path.join(projectRoot, script)).catch(() => {
      throw new Error(`Python script not found at ${path.join(projectRoot, script)}`);
    });

    await fs.copyFile(src, dst);

    let stdout = '';
    try {
      stdout = await new Promise<string>((resolve, reject) => {
        const child = spawn(PYTHON_BIN, [path.join(projectRoot, script!)], {
          cwd: backendDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: process.env,
        });

        let out = '';
        let err = '';
        child.stdout.on('data', d => (out += d.toString()));
        child.stderr.on('data', d => (err += d.toString()));
        child.on('error', reject);
        child.on('close', code => {
          if (code === 0) return resolve(out.trim());
          reject(new Error(`Python exited with ${code}\n${err || out}`));
        });
      });
    } finally {
      // 🔥 cleanup: remove the temp file no matter what happened
      await fs.unlink(dst).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      ran: script,
      input: `backend/uploads/file.pdf`,
      expectedOutput: `backend/uploads/Syllabus.json`,
      stdout,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}