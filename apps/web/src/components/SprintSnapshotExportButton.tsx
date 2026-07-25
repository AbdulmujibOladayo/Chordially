import React from 'react';

interface SprintSnapshotExportButtonProps {
  sprintName?: string;
  onExportComplete?: () => void;
}

export function SprintSnapshotExportButton({
  sprintName = 'Sprint 6',
  onExportComplete,
}: SprintSnapshotExportButtonProps) {
  return (
    <button
      onClick={onExportComplete}
      style={{ padding: '8px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
    >
      📥 Export {sprintName} Markdown Snapshot
    </button>
  );
}
