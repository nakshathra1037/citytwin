import React from 'react';
import { CesiumViewer } from '../components/cesium/CesiumViewer';

export const DigitalTwinPage = () => {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - var(--header-height))', position: 'relative' }}>
      <CesiumViewer />
    </div>
  );
};
