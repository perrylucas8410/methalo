export function filterResponseHeaders(headers, res) {
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    // Skip headers we rewrite or that break proxying
    if ([
      "set-cookie",
      "content-length",
      "transfer-encoding",
      "location",

      // CRITICAL: security headers that block JS shim + navigation
      "content-security-policy",
      "x-frame-options",
      "referrer-policy",
      "strict-transport-security"
    ].includes(lower)) {
      continue;
    }

    res.setHeader(key, value);
  }
}
