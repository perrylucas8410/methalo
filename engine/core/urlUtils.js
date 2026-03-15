export function normalizeUrl(input) {
  try {
    return new URL(input).toString();
  } catch {
    throw new Error("Invalid URL");
  }
}
