import React from 'react';
import { useCity } from '../../context/CityContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, LogOut, MapPin, Activity } from 'lucide-react';

export const Header = () => {
  const { cities, selectedCityId, changeCity } = useCity();
  const { refreshTelemetry, loading, lastUpdated } = useTelemetry();
  const { logout, user } = useAuth();

  return (
    <header className="top-header">
      <div className="header-brand">
        <img src="/logo.svg" alt="Living City Logo" />
        <div className="header-title-group">
          <div className="header-title">
            Living City
            <span className="header-badge">Digital Twin</span>
          </div>
          <span className="header-subtitle">URBAN AI DECISION SUPPORT PLATFORM</span>
        </div>
      </div>

      <div className="header-actions">
        {/* City Selector */}
        <div className="city-selector-wrapper">
          <MapPin size={15} color="#06B6D4" />
          <span className="city-selector-label">Target City:</span>
          <select
            className="city-select"
            value={selectedCityId}
            onChange={(e) => changeCity(e.target.value)}
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.country} → {c.state} → {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Telemetry Pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span className="status-indicator-dot" style={{ backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          <span>Live Sync</span>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ({lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>

        {/* Refresh Button */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 10px' }}
          onClick={refreshTelemetry}
          title="Refresh real-time city telemetry"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Logout */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 12px', color: 'var(--text-muted)' }}
          onClick={logout}
          title="Sign out of municipal console"
        >
          <LogOut size={14} />
          <span style={{ fontSize: '12px' }}>Logout</span>
        </button>
      </div>
    </header>
  );
};
