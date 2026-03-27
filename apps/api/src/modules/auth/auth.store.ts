import crypto from "node:crypto";
import type { AuthUser, UserRole } from "@chordially/types";

type StoredUser = AuthUser & {
  passwordHash: string;
};

const users = new Map<string, StoredUser>();

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function createUser(input: {
  email: string;
  username: string;
  password: string;
  role: UserRole;
}) {
  const email = input.email.toLowerCase();

  if (users.has(email)) {
    return null;
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    username: input.username,
    role: input.role,
    passwordHash: hashPassword(input.password)
  };

  users.set(email, user);

  return toAuthUser(user);
}

export function authenticateUser(email: string, password: string) {
  const existing = users.get(email.toLowerCase());

  if (!existing || existing.passwordHash !== hashPassword(password)) {
    return null;
  }

  return toAuthUser(existing);
}

export function getUserById(id: string) {
  for (const user of users.values()) {
    if (user.id === id) {
      return toAuthUser(user);
    }
  }

  return null;
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };
}
