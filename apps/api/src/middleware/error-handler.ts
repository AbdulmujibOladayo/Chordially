import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details ?? null
    });
    return;
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error";

  res.status(500).json({
    error: message
  });
}
