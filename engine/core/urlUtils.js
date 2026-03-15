export function normalizeUrl(input) {
  try {
    return new URL(input).toString();
  } catch {
    throw new Error("Invalid URL");
  }
}
export function normalizeUrl(input) {
  return new URL(input).toString();
}

export function encodeUrl(url) {
  return encodeURIComponent(url);
}
