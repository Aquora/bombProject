export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  const uploadDir = path.join(process.cwd(), "backend", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const saved: { filename: string; diskPath: string; relativePath: string }[] = [];

  for (const f of files) {
    const bytes = await f.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${f.name}`;
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    saved.push({
      filename,
      diskPath: filePath,                 
      relativePath: `backend/uploads/${filename}`,
    });
  }

  return NextResponse.json({ ok: true, files: saved });
}