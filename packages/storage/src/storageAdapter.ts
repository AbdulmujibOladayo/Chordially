export type AssetKind = "avatar" | "banner" | "session-thumbnail" | "moment";

export const ALLOWED_MIME_TYPES: Record<AssetKind, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  banner: ["image/jpeg", "image/png", "image/webp"],
  "session-thumbnail": ["image/jpeg", "image/png"],
  moment: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
};

/** Max file sizes in bytes per asset kind. */
export const MAX_BYTES: Record<AssetKind, number> = {
  avatar: 2 * 1024 * 1024,          // 2 MB
  banner: 5 * 1024 * 1024,          // 5 MB
  "session-thumbnail": 3 * 1024 * 1024, // 3 MB
  moment: 50 * 1024 * 1024,         // 50 MB
};

/** Retention in days; 0 = keep indefinitely. */
export const RETENTION_DAYS: Record<AssetKind, number> = {
  avatar: 0,
  banner: 0,
  "session-thumbnail": 365,
  moment: 180,
};

export interface UploadRequest {
  kind: AssetKind;
  mimeType: string;
  sizeBytes: number;
  ownerId: string;
}

export interface UploadResult {
  key: string;
  url: string;
  expiresAt: string | null;
}

/** Validate an upload request against allowed types and size limits. */
export function validateUpload(req: UploadRequest): void {
  if (!ALLOWED_MIME_TYPES[req.kind].includes(req.mimeType)) {
    throw new Error(`MIME type ${req.mimeType} not allowed for ${req.kind}`);
  }
  if (req.sizeBytes > MAX_BYTES[req.kind]) {
    throw new Error(`File exceeds max size for ${req.kind}`);
  }
}

/** Build a storage key for an asset. */
export function buildKey(req: UploadRequest, fileId: string): string {
  return `${req.kind}/${req.ownerId}/${fileId}`;
}
