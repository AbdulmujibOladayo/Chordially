import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

async function startApp() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise<void>((resolve) => server.once("listening", () => resolve()));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected tcp server address");
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

test("wallet challenge and verify flow succeeds with expected demo signature", async () => {
  const { server, baseUrl } = await startApp();

  const publicKey = "GCFX3GM2V4N2O5NFEZ5XGUV3VZL57BC4Q43SGV5WW6H2I6J53GVL5W7W";

  const challengeResponse = await fetch(`${baseUrl}/wallets/challenge`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ publicKey })
  });
  const challengeJson = await challengeResponse.json();

  const verifyResponse = await fetch(`${baseUrl}/wallets/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKey,
      signature: `signed:${challengeJson.challenge}`
    })
  });
  const verifyJson = await verifyResponse.json();

  assert.equal(challengeResponse.status, 200);
  assert.equal(verifyResponse.status, 200);
  assert.equal(verifyJson.verified, true);

  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("payment preparation returns a ready transaction payload", async () => {
  const { server, baseUrl } = await startApp();

  const response = await fetch(`${baseUrl}/payments/prepare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      amount: "10.00",
      asset: "USDC",
      destination: "GCFX3GM2V4N2O5NFEZ5XGUV3VZL57BC4Q43SGV5WW6H2I6J53GVL5W7W"
    })
  });
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.status, "ready");
  assert.equal(json.asset, "USDC");
  assert.equal(json.network, "testnet");

  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});
