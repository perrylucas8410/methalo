import cookie from "cookie";
import crypto from "crypto";

const sessions = new Map();

export function getSession(req, res) {
  const cookies = cookie.parse(req.headers.cookie || "");
  let sid = cookies.sid;

  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomBytes(16).toString("hex");
    sessions.set(sid, { cookies: [] });

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sid", sid, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
      })
    );
  }

  return sessions.get(sid);
}
