import { env } from "./env.js";

console.log(
  JSON.stringify(
    {
      status: "ok",
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      stellarNetwork: env.STELLAR_NETWORK
    },
    null,
    2
  )
);
