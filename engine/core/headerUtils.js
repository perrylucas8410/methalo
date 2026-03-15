export function filterResponseHeaders(headers, res) {
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    if ([
      "set-cookie",
      "content-length",
      "transfer-encoding",
      "location",
      "content-security-policy",
      "x-frame-options",
      "referrer-policy",
      "strict-transport-security",
      "cross-origin-opener-policy",
      "cross-origin-embedder-policy",
      "cross-origin-resource-policy"
    ].includes(lower)) {
      continue;
    }

    res.setHeader(key, value);
  }
}
