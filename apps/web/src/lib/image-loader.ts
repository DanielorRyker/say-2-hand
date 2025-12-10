/**
 * Custom Image Loader for Next.js
 * Handles GCS bucket URLs and relative paths
 */

export default function imageLoader({
  src,
  width: _width,
  quality: _quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If src is already a full URL (http:// or https://), return as is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // If src starts with /, it's a local public file
  if (src.startsWith("/")) {
    return src;
  }

  // For relative paths (like "avatars/1761236093495-146010"),
  // prepend with GCS bucket URL
  const URL_GCS =
    process.env.NEXT_PUBLIC_URL_GCS ||
    "https://storage.googleapis.com/say2hand";
  const base = URL_GCS.replace(/\/+$/, ""); // Remove trailing slashes
  const cleanPath = src.replace(/^\/+/, ""); // Remove leading slashes

  return `${base}/${cleanPath}`;
}
