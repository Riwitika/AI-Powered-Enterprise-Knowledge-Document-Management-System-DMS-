import { getAccessToken } from '../../api/client';

const blobUrlCache = new Map<string, string>();

export async function loadAuthenticatedImageSrc(src: string): Promise<string> {
  if (!src.startsWith('/api/')) {
    return src;
  }

  const cached = blobUrlCache.get(src);
  if (cached) return cached;

  const headers: HeadersInit = {};
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(src, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load image (${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  blobUrlCache.set(src, blobUrl);
  return blobUrl;
}

export function revokeAuthenticatedImageSrc(src: string) {
  const cached = blobUrlCache.get(src);
  if (cached) {
    URL.revokeObjectURL(cached);
    blobUrlCache.delete(src);
  }
}
