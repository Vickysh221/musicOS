/**
 * Prefix asset URLs with VITE_AUDIO_BASE if set.
 * Allows switching between local /audio_fusion/ and remote CDN.
 */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.VITE_AUDIO_BASE || '';
  if (!base) return relativePath;
  return `${base}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}
