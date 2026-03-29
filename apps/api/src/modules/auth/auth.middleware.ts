import type { NextFunction, Request, Response } from "express";
import { getUserById } from "./auth.store.js";
import { verifyToken } from "./auth.tokens.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: ReturnType<typeof getUserById>;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length);
  const userId = verifyToken(token);

  if (!userId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const user = getUserById(userId);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.authUser = user;
  next();
}
