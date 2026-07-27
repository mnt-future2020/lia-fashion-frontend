import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
// Image URL helper used by every <Image> on the site.
//
// Routing by host:
//   - Cloudflare R2 / DigitalOcean Spaces  -> returned untouched. These are our own stores
//     and already serve over a CDN; they are also pre-optimised at upload (WebP + resize),
//     so proxying them through Cloudinary Fetch would add a hop and burn Cloudinary
//     bandwidth for images not even hosted there.
//   - res.cloudinary.com                   -> legacy images; keep and add f_auto,q_auto.
//   - anything else                        -> unchanged: optimise via Cloudinary Fetch.
export function optimizeCloudinary(url) {
  if (!url || typeof url !== 'string') return url;
  // Skip local/relative paths (assets, placeholders)
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  try {
    const u = new URL(url);

    // Our own object storage (R2 / Spaces / custom CDN domain) — serve straight from its CDN.
    if (
      u.hostname.includes('r2.dev') ||
      u.hostname.includes('r2.cloudflarestorage.com') ||
      u.hostname.includes('digitaloceanspaces.com') ||
      u.hostname.includes('cdn.liafashion.in')
    ) {
      return url;
    }

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