import React from 'react';
import { useCity } from '../context/CityContext';
import { useTelemetry } from '../context/TelemetryContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusPill } from '../components/common/StatusPill';
import { 
  CloudRain, 
  Car, 
  Droplets, 
  Wind, 
  Gauge, 
  HeartPulse, 
  Thermometer, 
  ShieldAlert,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';

export const DashboardPage = ({ setActivePage }) => {
  const { selectedCity } = useCity();
  const { telemetry, loading, lastUpdated } = useTelemetry();

  const weather = telemetry?.weather;
  const traffic = telemetry?.traffic;
  const aqi = telemetry?.aqi;
  const floodRisk = telemetry?.derived_flood_risk;
  const cityHealth = telemetry?.city_health;

  return (
    <div className="page-container">
      {/* Top Banner: City Intelligence Summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
              {selectedCity?.name || 'City Operations'} Intelligence Console
            </h1>
            <StatusPill 
              level={cityHealth?.level || 'Good'} 
              label={`Status: ${cityHealth?.level || 'Optimal'}`} 
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            {selectedCity?.state}, {selectedCity?.country} &bull; Population: {selectedCity?.population?.toLocaleString()} &bull; Area: {selectedCity?.area_km2} km²
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Clock size={14} />
          <span>Last Telemetry Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Synchronizing...'}</span>
        </div>
      </div>

      {/* Row 1: Core Command Indicators */}
      <div className="metrics-grid">
        {/* Overall City Health Score */}
        <MetricCard
          title="City Health Index"
          icon={HeartPulse}
          originTag="Derived"
          value={cityHealth?.score != null ? cityHealth.score : '—'}
          unit="/ 100"
          statusLevel={cityHealth?.level || 'Good'}
          statusLabel={cityHealth?.level || 'Good'}
          footerNote="Deterministic Formula"
          unavailable={cityHealth?.status === 'insufficient_data'}
          unavailableMessage="Insufficient data"
        />

        {/* Derived Flood Risk */}
        <MetricCard
          title="Derived Flood Risk"
          icon={Droplets}
          originTag="Derived"
          value={floodRisk?.score != null ? floodRisk.score : '—'}
          unit="/ 100"
          statusLevel={floodRisk?.level || 'Low'}
          statusLabel={`${floodRisk?.level || 'Low'} Risk`}
          footerNote="Rainfall + Saturation Index"
          unavailable={floodRisk?.status === 'insufficient_data'}
          unavailableMessage="Data unavailable"
        />

        {/* Traffic Congestion */}
        <MetricCard
          title="Traffic Congestion"
          icon={Car}
          originTag="TomTom API"
          value={traffic?.congestion_percentage != null ? `${traffic.congestion_percentage}%` : '—'}
          unit={traffic?.current_speed ? `(${traffic.current_speed} km/h avg)` : ''}
          statusLevel={traffic?.traffic_level || 'Low'}
          statusLabel={traffic?.traffic_level || 'Low Flow'}
          footerNote={`Free Flow: ${traffic?.free_flow_speed || 50} km/h`}
          unavailable={traffic?.status !== 'available'}
          unavailableMessage="Traffic data unavailable"
        />

        {/* Ambient Temperature */}
        <MetricCard
          title="Temperature"
          icon={Thermometer}
          originTag="OpenWeather"
          value={weather?.temperature != null ? `${weather.temperature}` : '—'}
          unit="°C"
          statusLevel={weather?.weather_severity === 'Severe' ? 'High' : (weather?.weather_severity === 'Watch' ? 'Moderate' : 'Low')}
          statusLabel={weather?.weather_condition || 'Normal'}
          footerNote={weather?.feels_like ? `Feels like ${weather.feels_like}°C` : 'OpenWeather API'}
          unavailable={weather?.status !== 'available'}
          unavailableMessage="Weather data unavailable"
        />
      </div>

      {/* Row 2: Secondary Meteorological & Environmental Indicators */}
      <div className="metrics-grid">
        {/* Precipitation Rate */}
        <MetricCard
          title="Precipitation (1h)"
          icon={CloudRain}
          originTag="OpenWeather"
          value={weather?.rainfall_1h != null ? weather.rainfall_1h : '0.0'}
          unit="mm/h"
          statusLevel={weather?.rainfall_1h >= 15 ? 'High' : (weather?.rainfall_1h >= 5 ? 'Moderate' : 'Low')}
          statusLabel={weather?.rainfall_1h > 0 ? `${weather.rainfall_1h} mm/h` : 'No Active Rain'}
          footerNote={`Forecast 3h: ${weather?.forecast_rain_3h || 0.0} mm`}
          unavailable={weather?.status !== 'available'}
          unavailableMessage="Precipitation data unavailable"
        />

        {/* Atmospheric Humidity */}
        <MetricCard
          title="Relative Humidity"
          icon={Droplets}
          originTag="OpenWeather"
          value={weather?.humidity != null ? `${weather.humidity}%` : '—'}
          unit=""
          statusLevel={weather?.humidity >= 85 ? 'Moderate' : 'Low'}
          statusLabel={weather?.humidity >= 85 ? 'High Saturation' : 'Normal'}
          footerNote={`Cloudiness: ${weather?.cloudiness ?? 0}%`}
          unavailable={weather?.status !== 'available'}
          unavailableMessage="Humidity data unavailable"
        />

        {/* Wind Speed */}
        <MetricCard
          title="Wind Velocity"
          icon={Wind}
          originTag="OpenWeather"
          value={weather?.wind_speed != null ? `${weather.wind_speed}` : '—'}
          unit="km/h"
          statusLevel={weather?.wind_speed >= 50 ? 'High' : (weather?.wind_speed >= 30 ? 'Moderate' : 'Low')}
          statusLabel={weather?.wind_speed >= 50 ? 'High Gale' : 'Normal'}
          footerNote="Surface Anemometer"
          unavailable={weather?.status !== 'available'}
          unavailableMessage="Wind data unavailable"
        />

        {/* Air Quality Index */}
        <MetricCard
          title="Air Quality (AQI)"
          icon={Gauge}
          originTag="AQI API"
          value={aqi?.aqi != null ? `Scale ${aqi.aqi} / 5` : '—'}
          unit={aqi?.pm2_5 ? `(PM2.5: ${aqi.pm2_5})` : ''}
          statusLevel={aqi?.aqi >= 4 ? 'High' : (aqi?.aqi === 3 ? 'Moderate' : 'Low')}
          statusLabel={aqi?.category || 'Moderate'}
          footerNote={aqi?.no2 ? `NO2: ${aqi.no2} µg/m³` : 'OpenPollution'}
          unavailable={aqi?.status !== 'available'}
          unavailableMessage="Air quality data unavailable"
        />
      </div>

      {/* Row 3: Transparent Formula Disclosures & Quick Action Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Derived Flood Risk Card */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <Droplets size={18} color="#06B6D4" />
              <span>Derived Flood Risk Breakdown</span>
            </div>
            <span className="metric-origin-tag">Deterministic Math</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              There is no physical water-level sensor. Flood risk is a <b>derived indicator</b> calculated from active precipitation, 3-hour and 24-hour meteorological forecasts, atmospheric saturation, and cloud density.
            </p>

            <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)' }}>
              Formula: (Rainfall_1h &times; 0.35) + (Forecast_3h &times; 0.30) + (Humidity &times; 0.15) + (Cloudiness &times; 0.10) + (Rainfall_24h &times; 0.10)
            </div>

            {floodRisk?.calculation_breakdown && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Current Rain Weight (35%): <b style={{ color: 'var(--text-primary)' }}>{floodRisk.calculation_breakdown.current_rainfall_component ?? 0} pts</b></div>
                <div style={{ color: 'var(--text-muted)' }}>Forecast 3h Weight (30%): <b style={{ color: 'var(--text-primary)' }}>{floodRisk.calculation_breakdown.forecast_3h_component ?? 0} pts</b></div>
                <div style={{ color: 'var(--text-muted)' }}>Humidity Saturation (15%): <b style={{ color: 'var(--text-primary)' }}>{floodRisk.calculation_breakdown.humidity_saturation_component ?? 0} pts</b></div>
                <div style={{ color: 'var(--text-muted)' }}>Cloud Density (10%): <b style={{ color: 'var(--text-primary)' }}>{floodRisk.calculation_breakdown.cloud_density_component ?? 0} pts</b></div>
              </div>
            )}
          </div>
        </div>

        {/* City Health Calculation Card */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <HeartPulse size={18} color="#10B981" />
              <span>City Health Score Model</span>
            </div>
            <span className="metric-origin-tag">Transparent Score</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              City Health represents holistic municipal stability bounded between 0 and 100. Penalties are subtracted from baseline 100 based on verified real indicators.
            </p>

            <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)' }}>
              100 - (Traffic Congestion + Flood Risk + Weather Severity + AQI Penalties)
            </div>

            {cityHealth?.penalties && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Traffic Penalty: <b style={{ color: '#EF4444' }}>-{cityHealth.penalties.traffic_congestion_penalty ?? 0} pts</b></div>
                <div style={{ color: 'var(--text-muted)' }}>Flood Penalty: <b style={{ color: '#EF4444' }}>-{cityHealth.penalties.flood_risk_penalty ?? 0} pts</b></div>
                <div style={{ color: 'var(--text-muted)' }}>Weather Penalty: <b style={{ color: '#EF4444' }}>-{cityHealth.penalties.weather_severity_penalty ?? 0} pts</b></div>
                <div style={{ color: 'var(--text-muted)' }}>AQI Penalty: <b style={{ color: '#EF4444' }}>-{cityHealth.penalties.air_quality_penalty ?? 0} pts</b></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Quick Launcher */}
      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Explore Urban Decision Support Modules</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: 2 }}>
              Inspect 3D geospatial infrastructure, ML predictive horizons, or stress-test scenarios.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setActivePage('digital-twin')}>
              <span>3D Digital Twin</span>
              <ExternalLink size={13} />
            </button>
            <button className="btn btn-secondary" onClick={() => setActivePage('prediction')}>
              <span>ML Predictions</span>
              <ExternalLink size={13} />
            </button>
            <button className="btn btn-primary" onClick={() => setActivePage('simulation')}>
              <span>What-If Simulation</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
