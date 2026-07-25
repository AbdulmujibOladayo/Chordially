import React from 'react';

interface RepoHealthDashboardCardProps {
  score?: number;
  actionRequired?: boolean;
}

export function RepoHealthDashboardCard({
  score = 92,
  actionRequired = false,
}: RepoHealthDashboardCardProps) {
  return (
    <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#0f172a' }}>Repository Health Score</h4>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: score >= 90 ? '#16a34a' : '#d97706' }}>
        {score} / 100
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
        Triage Status: {actionRequired ? '⚠️ Action Required' : '✅ All Health Checks Passing'}
      </div>
    </div>
  );
}
