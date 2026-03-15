import { request } from "undici";
import { getSession } from "./sessionStore.js";
import { filterResponseHeaders } from "./headerUtils.js";
import { rewriteHTML } from "../rewrite/htmlRewriter.js";

export default async function httpClient(req, res, url) {
  const session = getSession(req, res);

  const headers = { ...req.headers };

  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];

  if (session.cookies.length) {
    headers["cookie"] = session.cookies.join("; ");
  }

  const upstream = await request(url, {
    method: req.method || "GET",
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req
  });

  const setCookie = upstream.headers["set-cookie"];
  if (setCookie) {
    const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
    session.cookies = arr;
  }

  const contentType = upstream.headers["content-type"] || "";

  if (upstream.statusCode >= 300 && upstream.statusCode < 400) {
    const loc = upstream.headers["location"];
    if (loc) {
      const absolute = new URL(loc, url).toString();
      const proxied = "/proxy?url=" + encodeURIComponent(absolute);
      res.status(upstream.statusCode);
      res.setHeader("Location", proxied);
    }

    filterResponseHeaders(upstream.headers, res);
    return res.end();
  }

  if (contentType.includes("text/html")) {
    const text = await upstream.body.text();
    const rewritten = rewriteHTML(text, url);

    res.status(upstream.statusCode);
    res.setHeader("Content-Type", "text/html");
    filterResponseHeaders(upstream.headers, res);

    return res.end(rewritten);
  }

  res.status(upstream.statusCode);
  filterResponseHeaders(upstream.headers, res);
  upstream.body.pipe(res);
}
