import { encodeUrl } from "../core/urlUtils.js";
import { injectShim } from "./injector.js";

// Safe URL detection
const URL_REGEX = /((https?:\/\/|\/)[^\s"'<>]+)(?=["'<>\s])/g;

// CSS url(...) detection
const CSS_URL_REGEX = /url\((['"]?)([^'")]+)\1\)/g;

// Inline JS string URL detection (hybrid mode)
const JS_URL_REGEX = /(['"])(https?:\/\/[^'"]+)\1/g;

// Attributes to rewrite
const ATTR_REGEX = /\b(href|src|action|data-src|data-href)=(['"])([^"']+)\2/gi;

export function rewriteHTML(html, baseUrl) {
  let output = html;

  // -----------------------------
  // 1. Rewrite attribute URLs
  // -----------------------------
  output = output.replace(ATTR_REGEX, (match, attr, quote, value) => {
    if (value.startsWith("#") || value.startsWith("javascript:") || value.startsWith("mailto:")) {
      return match;
    }
    try {
      const absolute = new URL(value, baseUrl).toString();
      const proxied = "/proxy?url=" + encodeUrl(absolute);
      return `${attr}=${quote}${proxied}${quote}`;
    } catch {
      return match;
    }
  });

  // -----------------------------
  // 2. Rewrite CSS url(...)
  // -----------------------------
  output = output.replace(CSS_URL_REGEX, (match, quote, value) => {
    if (value.startsWith("data:")) return match;
    try {
      const absolute = new URL(value, baseUrl).toString();
      const proxied = "/proxy?url=" + encodeUrl(absolute);
      return `url(${quote}${proxied}${quote})`;
    } catch {
      return match;
    }
  });

  // -----------------------------
  // 3. Rewrite inline JS URLs (hybrid mode)
  // -----------------------------
  output = output.replace(JS_URL_REGEX, (match, quote, value) => {
    try {
      const absolute = new URL(value, baseUrl).toString();
      const proxied = "/proxy?url=" + encodeUrl(absolute);
      return `${quote}${proxied}${quote}`;
    } catch {
      return match;
    }
  });

  // -----------------------------
  // 4. Rewrite raw URL-like strings
  // -----------------------------
  output = output.replace(URL_REGEX, (value) => {
    if (value.startsWith("data:")) return value;
    try {
      const absolute = new URL(value, baseUrl).toString();
      return "/proxy?url=" + encodeUrl(absolute);
    } catch {
      return value;
    }
  });

  // -----------------------------
  // 5. Inject JS shim before </head>
  // -----------------------------
  output = injectShim(output);

  return output;
}
