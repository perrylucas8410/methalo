export function filterResponseHeaders(headers, res) {
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;

    const lower = key.toLowerCase();

    if (["set-cookie", "content-length", "transfer-encoding", "location"].includes(lower)) {
  continue;
}

    res.setHeader(key, value);
  }
}
