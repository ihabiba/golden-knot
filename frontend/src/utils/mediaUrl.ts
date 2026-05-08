const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api';
// Strip the /api suffix to get the server root (e.g. http://localhost:8000)
const SERVER_ROOT = API_BASE.replace(/\/api\/?$/, '');

/**
 * Resolves a media file URL.
 * - Cloudinary / absolute URLs are returned as-is.
 * - Relative Django media paths (/media/...) are prefixed with the server root.
 * - null/empty → null
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SERVER_ROOT}${path.startsWith('/') ? '' : '/'}${path}`;
}
