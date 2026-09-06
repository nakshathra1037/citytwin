import React, { useState } from 'react';
import { useCity } from '../context/CityContext';
import { useTelemetry } from '../context/TelemetryContext';
import { simulationService } from '../services/simulationService';
import { StatusPill } from '../components/common/StatusPill';
import { 
  SlidersHorizontal, 
  Sparkles, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export const SimulationPage = () => {
  const { selectedCityId, selectedCity } = useCity();
  const { telemetry } = useTelemetry();

  // Scenario variables
  const [rainfallDelta, setRainfallDelta] = useState(50); // +50% default as specified
  const [trafficDelta, setTrafficDelta] = useState(25);
  const [drainageEfficiency, setDrainageEfficiency] = useState(1.0);
  const [scenarioTitle, setScenarioTitle] = useState('Monsoon Cloudburst Stress Test (+50% Rain)');

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await simulationService.runSimulation({
        city_id: selectedCityId,
        rainfall_delta_pct: parseFloat(rainfallDelta),
        traffic_delta_pct: parseFloat(trafficDelta),
        drainage_efficiency: parseFloat(drainageEfficiency),
        scenario_description: scenarioTitle
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
      setError('Simulation engine calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetParameters = () => {
    setRainfallDelta(0);
    setTrafficDelta(0);
    setDrainageEfficiency(1.0);
    setScenarioTitle('Baseline Status Scenario');
    setSimulationResult(null);
  };

  return (
    <div className="page-container">
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
              What-If Urban Scenario Simulation Engine
            </h1>
            <span className="metric-origin-tag">Deterministic Physics Re-calculator</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Stress-test <b>{selectedCity?.name}</b> infrastructure by modifying atmospheric and transport variables
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={resetParameters}>
            <RotateCcw size={14} />
            <span>Reset Sliders</span>
          </button>
          <button className="btn btn-primary" onClick={handleRunSimulation} disabled={loading}>
            <Play size={14} />
            <span>{loading ? 'Simulating...' : 'Execute Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Modifier Controls */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div className="panel-title">
            <SlidersHorizontal size={18} color="#06B6D4" />
            <span>Interactive Scenario Modifiers</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Baseline: Current Telemetry State
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Slider 1: Rainfall Delta */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="form-label">Precipitation Volume Delta</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: rainfallDelta > 0 ? '#EF4444' : (rainfallDelta < 0 ? '#10B981' : 'inherit') }}>
                {rainfallDelta > 0 ? `+${rainfallDelta}%` : `${rainfallDelta}%`}
              </span>
            </div>
            <input
              type="range"
              className="range-slider"
              min="-80"
              max="200"
              step="5"
              value={rainfallDelta}
              onChange={(e) => {
                setRainfallDelta(Number(e.target.value));
                setScenarioTitle(`What-If Scenario: Rainfall ${Number(e.target.value) >= 0 ? '+' : ''}${e.target.value}%`);
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>-80% (Drought)</span>
              <span>0% (Current)</span>
              <span>+200% (Severe Storm)</span>
            </div>
          </div>

          {/* Slider 2: Traffic Flow Delta */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="form-label">Traffic Volume Delta</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: trafficDelta > 0 ? '#F59E0B' : 'inherit' }}>
                {trafficDelta > 0 ? `+${trafficDelta}%` : `${trafficDelta}%`}
              </span>
            </div>
            <input
              type="range"
              className="range-slider"
              min="-50"
              max="150"
              step="5"
              value={trafficDelta}
              onChange={(e) => setTrafficDelta(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>-50% (Lockdown)</span>
              <span>0% (Normal Flow)</span>
              <span>+150% (Gridlock Surge)</span>
            </div>
          </div>

          {/* Slider 3: Drainage Infrastructure Efficiency */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="form-label">Storm Drainage Capacity Factor</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: drainageEfficiency < 1.0 ? '#EF4444' : '#10B981' }}>
                {(drainageEfficiency * 100).toFixed(0)}% ({drainageEfficiency < 1.0 ? 'Clogged' : (drainageEfficiency > 1.0 ? 'Upgraded' : 'Nominal')})
              </span>
            </div>
            <input
              type="range"
              className="range-slider"
              min="0.4"
              max="1.6"
              step="0.1"
              value={drainageEfficiency}
              onChange={(e) => setDrainageEfficiency(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>40% (Severe Siltation)</span>
              <span>100% (Nominal)</span>
              <span>160% (Retention Tanks)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Section */}
      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#EF4444', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {simulationResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Comparison Table */}
          <div className="panel" style={{ margin: 0 }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">{simulationResult.scenario_title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 3 }}>
                  Executed at {new Date(simulationResult.execution_timestamp).toLocaleTimeString()} &bull; Side-by-Side Indicator Comparison
                </div>
              </div>
              <span className="metric-origin-tag">Deterministic Recalculation</span>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Urban Indicator</th>
                    <th>Unit</th>
                    <th>Current Real Baseline</th>
                    <th>Simulated Scenario State</th>
                    <th>Calculated Change</th>
                    <th>Risk Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.comparison_table.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{row.indicator}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{row.unit}</td>
                      <td>{row.current_value}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.simulated_value}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.change}</td>
                      <td>
                        {row.risk_direction === 'worse' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontSize: '12px' }}>
                            <TrendingUp size={14} /> Risk Elevated
                          </span>
                        ) : row.risk_direction === 'better' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: '12px' }}>
                            <TrendingDown size={14} /> Improved
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '12px' }}>
                            <Minus size={14} /> Neutral
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: '16px', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} color="#F59E0B" />
              <span>{simulationResult.disclaimer}</span>
            </div>
          </div>

          {/* Gemini AI Explanation of Simulation */}
          <div className="panel" style={{ margin: 0, background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Sparkles size={18} color="#06B6D4" />
                <span>Google Gemini Decision-Support Explanation</span>
              </div>
              <span className="metric-origin-tag">Grounded on Recalculated Matrix</span>
            </div>

            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line', marginBottom: '16px' }}>
              {simulationResult.gemini_explanation}
            </div>

            {/* Recommendations */}
            {simulationResult.actionable_recommendations && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  Actionable Municipal Precautionary Measures
                </h4>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {simulationResult.actionable_recommendations.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State before running */
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <SlidersHorizontal size={40} color="#06B6D4" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Ready to Run Scenario Simulation</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '480px', margin: '8px auto 24px' }}>
            Modify precipitation or traffic volume using the sliders above, then click <b>Execute Simulation</b> to re-evaluate derived flood risk and City Health indicators deterministically.
          </p>
          <button className="btn btn-primary" onClick={handleRunSimulation} disabled={loading}>
            <Play size={15} />
            <span>Execute Scenario (+50% Rain Baseline)</span>
          </button>
        </div>
      )}
    </div>
  );
};
