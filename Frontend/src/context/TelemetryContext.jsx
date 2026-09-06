import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCity } from './CityContext';
import { telemetryService } from '../services/telemetryService';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const { selectedCityId } = useCity();
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTelemetry = useCallback(async () => {
    if (!selectedCityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await telemetryService.getCityTelemetry(selectedCityId);
      setTelemetry(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch city telemetry:', err);
      setError('Telemetry temporarily unavailable');
    } finally {
      setLoading(false);
    }
  }, [selectedCityId]);

  useEffect(() => {
    fetchTelemetry();
    // Auto-refresh telemetry every 60 seconds
    const interval = setInterval(fetchTelemetry, 60000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  return (
    <TelemetryContext.Provider value={{ telemetry, loading, error, refreshTelemetry: fetchTelemetry, lastUpdated }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);
