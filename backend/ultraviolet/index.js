import express from "express";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { createBareServer } from "@titaniumnetwork-dev/ultraviolet/bare";
import { uvMiddleware } from "@titaniumnetwork-dev/ultraviolet/middleware";

const app = express();
const bare = createBareServer("/bare/", {
  logErrors: true
});

app.use(express.static(uvPath));
app.use(uvMiddleware);

const server = app.listen(8080, () => {
  console.log("Ultraviolet running on port 8080");
});

server.on("upgrade", (req, socket, head) => {
  bare.handleUpgrade(req, socket, head);
});
