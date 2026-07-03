import { isSupabaseConfigured, supabaseAdmin } from './supabase';

export const MEDIA_BUCKET = 'listing-media';

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska', '3gp': 'video/3gpp',
};

function resolveMime(mimetype: string | undefined, filename?: string): string {
  const mt = (mimetype || '').toLowerCase();
  if (mt && mt !== 'application/octet-stream' && mt.includes('/')) return mt;
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  return EXT_MIME[ext] || mt || 'application/octet-stream';
}
function extFor(mimetype: string): string {
  const m = (mimetype.split(';')[0].split('/')[1] || 'bin').toLowerCase();
  return ({ jpeg: 'jpg', quicktime: 'mov', 'x-matroska': 'mkv', '3gpp': '3gp' } as Record<string, string>)[m] || m;
}
function key(prefix: string, mimetype: string): string {
  return `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extFor(mimetype)}`;
}
function mediaType(mimetype: string): 'image' | 'video' {
  return mimetype.startsWith('video') ? 'video' : 'image';
}

async function put(path: string, buf: Buffer, mimetype: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, buf, { contentType: mimetype, upsert: false });
  if (error) {
    console.error('storage upload failed', error.message);
    return null;
  }
  const { data } = db.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload base64 (from inbound WhatsApp media) → { type, url, mimetype } or null. */
export async function uploadBase64(base64: string, mimetype: string, prefix = 'wa', filename?: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const mt = resolveMime(mimetype, filename);
    const url = await put(key(prefix, mt), Buffer.from(base64, 'base64'), mt);
    return url ? { type: mediaType(mt), url, mimetype: mt } : null;
  } catch (e) {
    console.error('uploadBase64', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Upload a raw buffer (from a multipart file upload) → { type, url, mimetype } or null. */
export async function uploadBuffer(buf: Buffer, mimetype: string, prefix = 'upload', filename?: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const mt = resolveMime(mimetype, filename);
    const url = await put(key(prefix, mt), buf, mt);
    return url ? { type: mediaType(mt), url, mimetype: mt } : null;
  } catch (e) {
    console.error('uploadBuffer', e instanceof Error ? e.message : e);
    return null;
  }
}
