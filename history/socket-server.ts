/**
 * Issue #70 – Introduce Socket.io real-time event infrastructure
 *
 * File destination: apps/api/src/modules/realtime/socket.server.ts
 *
 * What this does:
 *  - Wraps the Express app in a Node http.Server
 *  - Attaches a Socket.io Server to that http instance
 *  - Optional JWT auth on the handshake (falls through gracefully if no token)
 *  - Clients join per-session rooms via "session:subscribe"
 *  - Exports emitTipConfirmed() and emitSessionStatus() for other modules
 *
 * Acceptance criteria covered:
 *  ✓ Backend emits events for tip confirmation and session status changes
 *  ✓ Clients can subscribe to relevant session streams
 *  ✓ Connection failures degrade gracefully (next() is always called)
 */

import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "../apps/api/src/modules/auth/auth.tokens.js";
import { getUserById } from "../apps/api/src/modules/auth/auth.store.js";

// ─── Payload shapes ──────────────────────────────────────────────────────────

export interface TipConfirmedPayload {
  id: string;
  fanName: string;
  amount: number;
  assetCode: "XLM" | "USDC";
  note?: string;
  confirmedAt: string;
}

export interface SessionStatusPayload {
  sessionId: string;
  status: "DRAFT" | "LIVE" | "ENDED" | "CANCELLED";
}

// ─── Module-level singleton ───────────────────────────────────────────────────

let io: Server | null = null;

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Call once from server.ts after createApp():
 *
 *   const app        = createApp();
 *   const httpServer = http.createServer(app);
 *   initSocketServer(httpServer);
 *   httpServer.listen(env.PORT, ...);
 */
export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.WEB_ORIGIN ?? "*",
      methods: ["GET", "POST"],
    },
  });

  // Optional auth middleware – attach user data when a valid token is present,
  // but always call next() so unauthenticated (public) fans can still subscribe.
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (token) {
      const userId = verifyToken(token);
      if (userId) {
        const user = getUserById(userId);
        if (user) {
          socket.data.user = user;
        }
      }
    }
    next(); // never block – degrade gracefully
  });

  io.on("connection", (socket) => {
    // Fan joins a session room to receive its tip events
    socket.on("session:subscribe", (sessionId: unknown) => {
      if (typeof sessionId === "string" && sessionId.trim().length > 0) {
        socket.join(`session:${sessionId}`);
      }
    });

    // Fan explicitly leaves a session room (e.g. navigating away)
    socket.on("session:unsubscribe", (sessionId: unknown) => {
      if (typeof sessionId === "string") {
        socket.leave(`session:${sessionId}`);
      }
    });

    // Disconnect is handled automatically by socket.io – no cleanup needed
  });

  return io;
}

// ─── Emitters (called by tip routes after DB write) ───────────────────────────

export function emitTipConfirmed(sessionId: string, tip: TipConfirmedPayload): void {
  io?.to(`session:${sessionId}`).emit("tip:confirmed", tip);
}

export function emitSessionStatus(sessionId: string, status: SessionStatusPayload["status"]): void {
  const payload: SessionStatusPayload = { sessionId, status };
  io?.to(`session:${sessionId}`).emit("session:status", payload);
}

export function getSocketServer(): Server | null {
  return io;
}
