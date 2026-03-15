import express from "express";
import httpClient from "./httpClient.js";
import { normalizeUrl } from "./urlUtils.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const target = req.query.url;
    if (!target) return res.status(400).send("Missing url");

    const url = normalizeUrl(target);
    await httpClient(req, res, url);
  } catch (err) {
    next(err);
  }
});

export default router;
