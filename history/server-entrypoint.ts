/**
 * Issue #70 – Introduce Socket.io real-time event infrastructure
 *
 * File destination: apps/api/src/server.ts  (replaces existing server.ts)
 *
 * Change summary:
 *  - Wraps the Express app in a native http.Server
 *  - Passes the http server to initSocketServer() before listening
 *  - All other behaviour unchanged
 */

import http from "http";
import { env } from "./apps/api/src/config/env.js";
import { createApp } from "./apps/api/src/app.js";
import { initSocketServer } from "./socket-server.js";

const app = createApp();
const httpServer = http.createServer(app);

initSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
