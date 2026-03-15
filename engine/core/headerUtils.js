export function filterResponseHeaders(headers, res) {
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    // Skip headers we rewrite manually
    if (["set-cookie", "content-length", "transfer-encoding", "location"].includes(lower)) {
      continue;
    }

    res.setHeader(key, value);
  }
}
