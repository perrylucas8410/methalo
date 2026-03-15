import { request } from "undici";
import { getSession } from "./sessionStore.js";
import { filterResponseHeaders } from "./headerUtils.js";
import { rewriteHTML } from "../rewrite/htmlRewriter.js";

export default async function httpClient(req, res, url) {
  const session = getSession(req, res);

  const headers = {
    "User-Agent": req.headers["user-agent"] || "",
    "Accept": req.headers["accept"] || "*/*",
    "Accept-Language": req.headers["accept-language"] || "",
  };

  if (session.cookies.length) {
    headers["Cookie"] = session.cookies.join("; ");
  }

  if (req.headers["range"]) {
    headers["Range"] = req.headers["range"];
  }

  const upstream = await request(url, {
    method: "GET",
    headers,
  });

  // Save cookies
  const setCookie = upstream.headers["set-cookie"];
  if (setCookie) {
    const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
    session.cookies = arr;
  }

  const contentType = upstream.headers["content-type"] || "";

  // If HTML → rewrite it
  if (contentType.includes("text/html")) {
    const text = await upstream.body.text();
    const rewritten = rewriteHTML(text, url);

    res.setHeader("Content-Type", "text/html");
    return res.send(rewritten);
  }

  // Otherwise → stream normally
  res.status(upstream.statusCode);

// Handle redirect headers
if (upstream.statusCode >= 300 && upstream.statusCode < 400) {
  const loc = upstream.headers["location"];
  if (loc) {
    const absolute = new URL(loc, url).toString();
    const proxied = "/proxy?url=" + encodeURIComponent(absolute);
    res.setHeader("Location", proxied);
  }
}

// Filter other headers
filterResponseHeaders(upstream.headers, res);

  upstream.body.pipe(res);
}
