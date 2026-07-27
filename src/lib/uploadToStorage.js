import axios from "./axios";
import { compressImage } from "./imageCompression";

/**
 * Upload a single image to object storage the moment it is selected, and return its public URL.
 *
 * Flow: browser pre-shrink (compressImage → WebP, protects the server + speeds the upload)
 *       → POST /api/admin/uploads/image (backend optimises again + stores on R2)
 *       → returns { url }.
 *
 * The product form stores that URL and, on final submit, sends only URLs (no files) — so the
 * "create product" request stays small and fast and the server never processes many large
 * images in one request.
 *
 * @param {File} file
 * @param {string} folder  one of: products | banners | categories | company | profiles
 * @returns {Promise<string>} the stored public URL
 */
export async function uploadImageToStorage(file, folder = "products") {
  // Pre-shrink in the browser first (also enforces the max-size limit and throws a friendly
  // error). The backend optimises again as the authoritative step.
  const optimised = await compressImage(file);

  const formData = new FormData();
  formData.append("file", optimised);
  formData.append("folder", folder);

  const { data } = await axios.post("/api/admin/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (data?.status !== "success" || !data?.url) {
    throw new Error(data?.message || "Upload failed");
  }

  return data.url;
}

/**
 * Best-effort delete of an already-uploaded file (e.g. when the admin removes an image before
 * submitting the form). Never throws — an orphaned object is harmless.
 *
 * @param {string} url
 */
export async function deleteUploadedImage(url) {
  if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) return;
  try {
    await axios.delete("/api/admin/uploads", { data: { url } });
  } catch (_e) {
    // ignore — orphan cleanup is not critical
  }
}
