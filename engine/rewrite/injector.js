import fs from "fs";
import path from "path";

const shimPath = path.resolve("rewrite/jsShim.js");
const shimCode = fs.readFileSync(shimPath, "utf8");

export function injectShim(html) {
  const injection = `<script>${shimCode}</script>`;
  return html.replace("</head>", injection + "</head>");
}
