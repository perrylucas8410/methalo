import express from "express";
import router from "./core/router.js";
import logging from "./middleware/logging.js";
import clientId from "./middleware/clientId.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = 8080;

// middleware
app.use(logging);
app.use(clientId);

// routes
app.use("/proxy", router);

// error handler
app.use(errorHandler);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Methalo Engine running at http://127.0.0.1:${PORT}`);
});
