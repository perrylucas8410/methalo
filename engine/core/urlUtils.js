export function normalizeUrl(input) {
  return new URL(input).toString();
}

export function encodeUrl(url) {
  return encodeURIComponent(url);
}
