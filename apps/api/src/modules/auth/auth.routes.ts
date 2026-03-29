import { Router } from "express";
import type { AuthResponse, SessionResponse } from "@chordially/types";
import { validateBody } from "../../lib/validate.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { authenticateUser, createUser } from "./auth.store.js";
import { requireAuth } from "./auth.middleware.js";
import { signToken } from "./auth.tokens.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), (req, res) => {
  const user = createUser(req.body);

  if (!user) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const response: AuthResponse = {
    token: signToken(user.id),
    user
  };

  res.status(201).json(response);
});

authRouter.post("/login", validateBody(loginSchema), (req, res) => {
  const user = authenticateUser(req.body.email, req.body.password);

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const response: AuthResponse = {
    token: signToken(user.id),
    user
  };

  res.status(200).json(response);
});

authRouter.get("/session", requireAuth, (req, res) => {
  const response: SessionResponse = {
    authenticated: true,
    user: req.authUser ?? null
  };

  res.status(200).json(response);
});
