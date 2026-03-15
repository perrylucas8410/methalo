export default function clientId(req, res, next) {
  req.clientId = req.headers["x-forwarded-for"] || req.ip;
  next();
}
