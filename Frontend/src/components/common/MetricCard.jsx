import React from 'react';
import { StatusPill } from './StatusPill';

export const MetricCard = ({
  title,
  icon: Icon,
  originTag,
  value,
  unit,
  statusLevel,
  statusLabel,
  footerNote,
  unavailable = false,
  unavailableMessage = "Data unavailable"
}) => {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-title">
          {Icon && <Icon size={16} className="text-cyan-400" />}
          <span>{title}</span>
        </div>
        {originTag && <span className="metric-origin-tag">{originTag}</span>}
      </div>

      {unavailable ? (
        <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>
          {unavailableMessage}
        </div>
      ) : (
        <div className="metric-value-row">
          <span className="metric-value">{value ?? '—'}</span>
          {unit && <span className="metric-unit">{unit}</span>}
        </div>
      )}

      <div className="metric-footer">
        {statusLevel ? (
          <StatusPill level={statusLevel} label={statusLabel} />
        ) : (
          <span>{footerNote || 'Verified Telemetry'}</span>
        )}
        {footerNote && statusLevel && <span>{footerNote}</span>}
      </div>
    </div>
  );
};
