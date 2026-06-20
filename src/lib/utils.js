import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
// Optimize images via Cloudinary — handles both Cloudinary-hosted and external URLs
export function optimizeCloudinary(url) {
  if (!url || typeof url !== 'string') return url;
  // Skip local/relative paths (assets, placeholders)
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  try {
    const u = new URL(url);
    // Already a Cloudinary URL — inject f_auto,q_auto if missing
    if (u.hostname.includes('res.cloudinary.com')) {
      const marker = '/image/upload/';
      const idx = u.pathname.indexOf(marker);
      if (idx === -1) return url;
      const after = u.pathname.slice(idx + marker.length);
      if (/f_auto|q_auto/.test(after)) return url;
      u.pathname = u.pathname.replace(marker, `${marker}f_auto,q_auto/`);
      return u.toString();
    }
    // External URL (e.g. backend storage) — use Cloudinary Fetch to optimize & serve via CDN
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return url;
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto/${url}`;
  } catch {
    return url;
  }
}