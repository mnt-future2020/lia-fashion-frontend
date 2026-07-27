import imageCompression from 'browser-image-compression';

// Optimising in the browser (not on the PHP server) is deliberate: a product can carry
// 4–12 mobile photos at 12–24 MP each. Converting those server-side in one request risks
// PHP max_execution_time timeouts and memory_limit fatals on shared hosting. Doing it here
// moves the CPU to the admin's device AND makes the upload smaller/faster, not slower.

// Reject originals bigger than this outright (before we even try to compress).
export const MAX_UPLOAD_MB = 15;

const OPTIONS = {
  maxSizeMB: 0.3,          // aim for ~300 KB output
  maxWidthOrHeight: 1600,  // longest edge — plenty for product detail + zoom
  fileType: 'image/webp',  // ~30% smaller than JPEG, universally supported
  initialQuality: 0.8,
  useWebWorker: true,      // keeps the UI responsive while compressing
};

/**
 * Compress + convert a single image File to WebP.
 * Non-image files (e.g. PDFs) are returned untouched.
 * Throws a friendly Error for oversized input so the caller can toast it.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressImage(file) {
  if (!file || typeof file !== 'object') return file;
  if (!file.type || !file.type.startsWith('image/')) return file; // not an image → leave as-is

  // GIFs are often animated; compressing flattens them. Leave GIFs alone.
  if (file.type === 'image/gif') return file;

  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error(`Image is too large (max ${MAX_UPLOAD_MB} MB). Please choose a smaller photo.`);
  }

  try {
    const compressed = await imageCompression(file, OPTIONS);
    // Rename to .webp so the backend stores the correct extension.
    const name = (file.name || 'image').replace(/\.[^.]+$/, '') + '.webp';
    return new File([compressed], name, { type: 'image/webp' });
  } catch (err) {
    // If compression fails for any reason, fall back to the original so the admin is never
    // blocked — the backend still validates size/type and can resize as a last resort.
    console.error('Image compression failed, using original:', err);
    return file;
  }
}

/**
 * Compress many images. Oversized ones throw individually; use per-file try/catch at the
 * call site if you want to keep the good ones. This helper rejects on the first failure.
 *
 * @param {FileList|File[]} files
 * @returns {Promise<File[]>}
 */
export async function compressMany(files) {
  return Promise.all(Array.from(files).map((f) => compressImage(f)));
}
