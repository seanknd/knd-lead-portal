// /api/upload — receives photo uploads from the chat and stores them in
// Supabase Storage (lead-photos bucket). Returns signed URLs that can be
// embedded in the chat preview and later mirrored to HubSpot.
//
// Body: multipart/form-data with one or more "files" parts, plus an
// optional "leadId" field (UUID from lead_intake.leads). If no leadId is
// provided we still store the file but skip the photos-table row — the
// row gets backfilled when the chat finalizes via /api/submit.

import { NextResponse } from 'next/server';
import { supabase, leadIntake, LEAD_PHOTOS_BUCKET } from '../../lib/supabase';

export const runtime = 'nodejs';

// One-hour signed URLs are plenty for the chat preview. HubSpot mirror
// happens server-to-server and uses storage_path directly, not the URL.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid form data' }, { status: 400 });
  }

  const files = form.getAll('files') as File[];
  const leadId = (form.get('leadId') as string | null) || null;

  if (files.length === 0) {
    return NextResponse.json({ urls: [] });
  }

  const sb = supabase();
  const storage = sb.storage.from(LEAD_PHOTOS_BUCKET);
  const results: { url: string; path: string; filename: string }[] = [];
  const failures: string[] = [];

  for (const f of files) {
    try {
      const ext = f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.') + 1) : 'jpg';
      const path = `${leadId ?? 'pending'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buf = Buffer.from(await f.arrayBuffer());

      const { error: uploadErr } = await storage.upload(path, buf, {
        contentType: f.type || 'image/jpeg',
        upsert: false,
      });
      if (uploadErr) throw uploadErr;

      // Signed URL so the chat preview can display the image without
      // making the bucket public.
      const { data: signed, error: signErr } = await storage.createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (signErr || !signed) throw signErr ?? new Error('signed url failed');

      // If we know the lead ID already, record the photo row immediately.
      if (leadId) {
        const li: any = leadIntake();
        const { error: rowErr } = await li.from('photos').insert({
          lead_id: leadId,
          storage_path: path,
          filename: f.name,
          content_type: f.type,
          size_bytes: f.size,
        });
        if (rowErr) console.warn('[upload] photos row insert failed (file saved):', rowErr.message);
      }

      results.push({ url: signed.signedUrl, path, filename: f.name });
    } catch (e: any) {
      console.error('[upload] failed for', f.name, e?.message ?? e);
      failures.push(f.name);
    }
  }

  if (results.length === 0) {
    return NextResponse.json({ error: 'all uploads failed', failures }, { status: 500 });
  }

  return NextResponse.json({
    urls: results.map(r => r.url),
    paths: results.map(r => r.path),
    failures: failures.length ? failures : undefined,
  });
}
