// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  for (const f of files) {
    const bytes = await f.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${f.name}`;
    await writeFile(path.join(uploadDir, filename), buffer);
    urls.push(`/uploads/${filename}`); 
  }
  return NextResponse.json({ urls });
}