// Centralized runtime constants for the web app
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const URL_GCS = process.env.NEXT_PUBLIC_URL_GCS || "";

/**
 * Helper function to format image URL
 * Handles relative paths, absolute URLs, and GCS URLs
 */
export const formatImageUrl = (
  url: string | undefined | null
): string | null => {
  if (!url) return null;

  // Already an absolute URL (http:// or https://)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If we have a GCS URL configured, prepend it to the path
  if (URL_GCS) {
    // Normalize the path by removing any leading slashes so concatenation is safe
    const cleanPath = url.replace(/^\/+/, "");
    const base = URL_GCS.replace(/\/+$/, "");
    return `${base}/${cleanPath}`;
  }

  // Fallback: ensure path has leading slash
  return url.startsWith("/") ? url : `/${url}`;
};
