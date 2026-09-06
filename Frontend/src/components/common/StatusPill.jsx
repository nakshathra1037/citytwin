import React from 'react';

export const StatusPill = ({ level, label, className = '' }) => {
  const normLevel = (level || 'low').toLowerCase();
  
  let statusClass = 'low';
  if (normLevel.includes('mod') || normLevel.includes('fair') || normLevel.includes('watch')) {
    statusClass = 'moderate';
  } else if (normLevel.includes('high') || normLevel.includes('severe') || normLevel.includes('attention') || normLevel.includes('poor')) {
    statusClass = 'high';
  }

  return (
    <span className={`status-badge ${statusClass} ${className}`}>
      <span className="status-indicator-dot" />
      {label || level}
    </span>
  );
};
