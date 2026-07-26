import React from 'react';

interface WalletLinkVerificationBadgeProps {
  walletAddress?: string;
  isVerified?: boolean;
}

export function WalletLinkVerificationBadge({
  walletAddress = '0x123...456',
  isVerified = true,
}: WalletLinkVerificationBadgeProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: isVerified ? '#f0fdf4' : '#fffbe6', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
        👛 {walletAddress}
      </span>
      <span style={{ fontSize: '11px', padding: '2px 6px', background: isVerified ? '#dcfce7' : '#fef08a', color: isVerified ? '#15803d' : '#854d0e', borderRadius: '4px' }}>
        {isVerified ? 'VERIFIED' : 'PENDING'}
      </span>
    </div>
  );
}
