const DEFAULT_API_BASE_URL = "http://localhost:5000";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  "",
);

export function toApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
