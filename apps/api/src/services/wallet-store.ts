import crypto from "node:crypto";

interface WalletRecord {
  publicKey: string;
  challenge: string;
  verified: boolean;
}

const wallets = new Map<string, WalletRecord>();

export function createChallenge(publicKey: string) {
  const challenge = `verify:${crypto.randomUUID()}`;
  wallets.set(publicKey, {
    publicKey,
    challenge,
    verified: false
  });

  return challenge;
}

export function verifyWallet(publicKey: string, signature: string) {
  const wallet = wallets.get(publicKey);

  if (!wallet) {
    return null;
  }

  if (signature !== `signed:${wallet.challenge}`) {
    return null;
  }

  wallet.verified = true;
  wallets.set(publicKey, wallet);

  return {
    publicKey,
    verified: true
  };
}

export function getWallet(publicKey: string) {
  return wallets.get(publicKey) ?? null;
}
