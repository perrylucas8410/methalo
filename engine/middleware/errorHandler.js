export default function errorHandler(err, req, res, next) {
  console.error("Engine error:", err);
  res.status(500).send("Engine internal error");
}
