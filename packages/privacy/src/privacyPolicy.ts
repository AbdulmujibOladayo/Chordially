export type DataSubject = "fan" | "artist";

export interface PiiField {
  field: string;
  subject: DataSubject;
  retentionDays: number; // 0 = until account deletion
  exportable: boolean;
  deletable: boolean;
}

/** Canonical PII field registry for Chordially. */
export const PII_FIELDS: PiiField[] = [
  { field: "email",          subject: "fan",    retentionDays: 0,   exportable: true,  deletable: true  },
  { field: "email",          subject: "artist", retentionDays: 0,   exportable: true,  deletable: true  },
  { field: "walletAddress",  subject: "fan",    retentionDays: 0,   exportable: true,  deletable: false },
  { field: "walletAddress",  subject: "artist", retentionDays: 0,   exportable: true,  deletable: false },
  { field: "displayName",    subject: "fan",    retentionDays: 0,   exportable: true,  deletable: true  },
  { field: "displayName",    subject: "artist", retentionDays: 0,   exportable: true,  deletable: true  },
  { field: "ipAddress",      subject: "fan",    retentionDays: 90,  exportable: false, deletable: true  },
  { field: "ipAddress",      subject: "artist", retentionDays: 90,  exportable: false, deletable: true  },
  { field: "tipHistory",     subject: "fan",    retentionDays: 730, exportable: true,  deletable: false },
  { field: "sessionRecords", subject: "artist", retentionDays: 365, exportable: true,  deletable: false },
];

/** Return all exportable fields for a given subject. */
export function exportableFields(subject: DataSubject): PiiField[] {
  return PII_FIELDS.filter((f) => f.subject === subject && f.exportable);
}

/** Return all fields eligible for deletion for a given subject. */
export function deletableFields(subject: DataSubject): PiiField[] {
  return PII_FIELDS.filter((f) => f.subject === subject && f.deletable);
}

/** Check whether a field has exceeded its retention window. */
export function isExpired(field: PiiField, createdAt: Date): boolean {
  if (field.retentionDays === 0) return false;
  const cutoff = new Date(createdAt);
  cutoff.setDate(cutoff.getDate() + field.retentionDays);
  return new Date() > cutoff;
}
