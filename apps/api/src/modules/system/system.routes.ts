import { Router } from "express";
import { env } from "../../config/env.js";

export const systemRouter = Router();

systemRouter.get("/ready", (_req, res) => {
  res.status(200).json({
    status: "ready",
    environment: env.NODE_ENV,
    stellarNetwork: env.STELLAR_NETWORK
  });
});
