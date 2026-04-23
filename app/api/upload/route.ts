// /api/upload — file upload stub.
// In production this should stream to R2/S3 and return signed URLs.
// In dev we just echo back a fake URL so the UI flow can complete.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  const urls = files.map(f => `https://example.invalid/uploads/${encodeURIComponent(f.name)}`);
  return NextResponse.json({ urls, dryRun: true });
}
