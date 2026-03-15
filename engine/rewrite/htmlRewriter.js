import { injectShim } from "./injector.js";
import { parse } from "node-html-parser";
import { encodeUrl } from "../core/urlUtils.js";

export function rewriteHTML(html, baseUrl) {
  const root = parse(html);

  const attrsToRewrite = ["href", "src", "action"];

  root.querySelectorAll("*").forEach(el => {
    for (const attr of attrsToRewrite) {
      if (el.hasAttribute(attr)) {
        const original = el.getAttribute(attr);
        if (!original) continue;

        if (original.startsWith("#")) continue;
        if (original.startsWith("javascript:")) continue;
        if (original.startsWith("mailto:")) continue;

        const absolute = new URL(original, baseUrl).toString();
        const proxied = "/proxy?url=" + encodeUrl(absolute);

        el.setAttribute(attr, proxied);
      }
    }
  });

  let output = root.toString();
  output = injectShim(output);

  return output;
}
