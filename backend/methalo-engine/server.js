import express from "express";
import { request } from "undici";
import cookie from "cookie";
import crypto from "crypto";

const app = express();
const PORT = 8080;

// In-memory session → cookie jar
const sessions = new Map();

function getSession(req, res) {
  let sid;
  const cookies = cookie.parse(req.headers.cookie || "");
  if (cookies.sid && sessions.has(cookies.sid)) {
    sid = cookies.sid;
  } else {
    sid = crypto.randomBytes(16).toString("hex");
    sessions.set(sid, { cookies: [] });
    res.setHeader("Set-Cookie", cookie.serialize("sid", sid, {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    }));
  }
  return sessions.get(sid);
}

app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) {
    res.status(400).send("Missing url");
    return;
  }

  let url;
  try {
    url = new URL(target);
  } catch {
    res.status(400).send("Invalid url");
    return;
  }

  const session = getSession(req, res);

  // Build headers
  const headers = {
    "User-Agent": req.headers["user-agent"] || "",
    "Accept": req.headers["accept"] || "*/*",
    "Accept-Language": req.headers["accept-language"] || "",
  };

  if (session.cookies.length) {
    headers["Cookie"] = session.cookies.join("; ");
  }

  // Forward Range if present (YouTube, media)
  if (req.headers["range"]) {
    headers["Range"] = req.headers["range"];
  }

  try {
    const upstream = await request(url.toString(), {
      method: "GET",
      headers,
    });

    // Store Set-Cookie
    const setCookie = upstream.headers["set-cookie"];
    if (setCookie) {
      const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
      session.cookies = arr;
    }

    // Pass through status and headers (with some filtering)
    res.status(upstream.statusCode);
    for (const [key, value] of Object.entries(upstream.headers)) {
      if (!value) continue;
      const lower = key.toLowerCase();
      if (["content-length", "transfer-encoding"].includes(lower)) continue;
      if (lower === "set-cookie") continue;
      res.setHeader(key, value);
    }

    // Stream body
    upstream.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(502).send("Upstream error");
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Methalo engine listening on http://127.0.0.1:${PORT}`);
});
