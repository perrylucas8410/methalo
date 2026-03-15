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

  // ---------------------------------------------------------
  // 1. HANDLE REDIRECTS FIRST (CRITICAL)
  // ---------------------------------------------------------
  if (upstream.statusCode >= 300 && upstream.statusCode < 400) {
    const loc = upstream.headers["location"];
    if (loc) {
      const absolute = new URL(loc, url).toString();
      const proxied = "/proxy?url=" + encodeURIComponent(absolute);
      console.log("Rewriting redirect to:", proxied);
      res.status(upstream.statusCode);
      res.setHeader("Location", proxied);
    }

    // Filter other headers (but NOT Location)
    filterResponseHeaders(upstream.headers, res);

    return res.end(); // END REDIRECT RESPONSE
  }

  // ---------------------------------------------------------
  // 2. HTML REWRITING
  // ---------------------------------------------------------
  if (contentType.includes("text/html")) {
    const text = await upstream.body.text();
    const rewritten = rewriteHTML(text, url);

    res.status(upstream.statusCode);
    res.setHeader("Content-Type", "text/html");

    // Filter headers AFTER setting content-type
    filterResponseHeaders(upstream.headers, res);

    return res.send(rewritten);
  }

  // ---------------------------------------------------------
  // 3. EVERYTHING ELSE → STREAM
  // ---------------------------------------------------------
  res.status(upstream.statusCode);
  filterResponseHeaders(upstream.headers, res);

  upstream.body.pipe(res);
}
