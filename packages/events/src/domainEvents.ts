import { randomUUID } from "crypto";

export type EventName =
  | "session.started"
  | "session.ended"
  | "tip.created"
  | "tip.confirmed"
  | "tip.failed"
  | "moment.updated"
  | "moderation.flagged"
  | "analytics.ingested";

export interface DomainEvent<T = unknown> {
  id: string;
  name: EventName;
  occurredAt: string;
  traceId: string;
  payload: T;
}

export interface TipPayload {
  tipId: string;
  artistId: string;
  fanId: string;
  amountUsdc: number;
  txHash?: string;
}

export interface SessionPayload {
  sessionId: string;
  artistId: string;
  title: string;
}

export interface ModerationPayload {
  targetId: string;
  targetType: "session" | "user";
  reason: string;
}

/** Create a typed domain event with a generated ID and timestamp. */
export function createEvent<T>(
  name: EventName,
  payload: T,
  traceId: string = randomUUID()
): DomainEvent<T> {
  return {
    id: randomUUID(),
    name,
    occurredAt: new Date().toISOString(),
    traceId,
    payload,
  };
}

/** Validate that an object has the minimum shape of a DomainEvent. */
export function isDomainEvent(value: unknown): value is DomainEvent {
  const e = value as DomainEvent;
  return (
    typeof e?.id === "string" &&
    typeof e?.name === "string" &&
    typeof e?.occurredAt === "string" &&
    typeof e?.payload !== "undefined"
  );
}
