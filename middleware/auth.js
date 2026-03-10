import { db } from "../db.js";

const getUserStatement = db.prepare("SELECT * FROM users WHERE token = ?");

export function requireUser(req, res, next) {
  const token = req.header("x-token");
  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const user = getUserStatement.get(token);
  if (!user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  req.user = user;
  req.token = token;
  next();
}
