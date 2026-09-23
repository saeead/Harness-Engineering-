/**
 * StatusIndicator Primitive
 * Strictly adheres to anti-slop zero-pill discipline:
 * Unboxed clean text with subtle typographic indicator and accessible labels.
 */

import React from 'react';

export type StatusType = 'ready' | 'active' | 'pending' | 'warning' | 'error' | 'offline';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  sublabel?: string;
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { dotColor: string; defaultLabel: string; textColor: string }
> = {
  ready: {
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    defaultLabel: 'Ready',
  },
  active: {
    dotColor: 'bg-sky-500 animate-pulse',
    textColor: 'text-sky-400',
    defaultLabel: 'Active',
  },
  pending: {
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    defaultLabel: 'Pending',
  },
  warning: {
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    defaultLabel: 'Warning',
  },
  error: {
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    defaultLabel: 'Error',
  },
  offline: {
    dotColor: 'bg-neutral-600',
    textColor: 'text-neutral-400',
    defaultLabel: 'Offline',
  },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  sublabel,
  showDot = true,
  className = '',
}) => {
  const config = statusConfig[status] || statusConfig.offline;
  const displayLabel = label || config.defaultLabel;

  return (
    <div className={`inline-flex items-center gap-2 text-xs font-medium ${className}`}>
      {showDot && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`}
          aria-hidden="true"
        />
      )}
      <span className={config.textColor}>{displayLabel}</span>
      {sublabel && (
        <>
          <span className="text-neutral-600" aria-hidden="true">
            ·
          </span>
          <span className="text-neutral-400 tabular-nums">{sublabel}</span>
        </>
      )}
    </div>
  );
};
