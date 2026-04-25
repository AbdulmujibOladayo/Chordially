import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export const TRACE_HEADER = "x-trace-id";

/** Attach a correlation ID to every inbound HTTP request. */
export function tracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const traceId = (req.headers[TRACE_HEADER] as string | undefined) ?? randomUUID();
  req.headers[TRACE_HEADER] = traceId;
  res.setHeader(TRACE_HEADER, traceId);
  next();
}

/** Extract the trace ID from an Express request (falls back to a new UUID). */
export function getTraceId(req: Request): string {
  return (req.headers[TRACE_HEADER] as string | undefined) ?? randomUUID();
}

/** Propagate trace ID into a Socket.io handshake or event payload. */
export function injectSocketTrace(
  socket: { handshake: { headers: Record<string, string | undefined> } },
  next: (err?: Error) => void
): void {
  if (!socket.handshake.headers[TRACE_HEADER]) {
    socket.handshake.headers[TRACE_HEADER] = randomUUID();
  }
  next();
}

/** Build a log-friendly context object from a trace ID. */
export function traceContext(traceId: string): Record<string, string> {
  return { traceId, timestamp: new Date().toISOString() };
}

/** Wrap a background job function so it carries a fresh trace ID. */
export function withTrace<T>(fn: (traceId: string) => Promise<T>): Promise<T> {
  return fn(randomUUID());
}
