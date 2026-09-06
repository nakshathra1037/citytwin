import React, { useState, useEffect } from 'react';
import { useCity } from '../context/CityContext';
import { predictionService } from '../services/predictionService';
import { StatusPill } from '../components/common/StatusPill';
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Clock, 
  BarChart2, 
  AlertTriangle,
  Layers,
  RefreshCw
} from 'lucide-react';

export const PredictionPage = () => {
  const { selectedCityId, selectedCity } = useCity();
  const [predictionType, setPredictionType] = useState('flood'); // 'flood' or 'traffic'
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (predictionType === 'flood') {
        res = await predictionService.getFloodPrediction(selectedCityId);
      } else {
        res = await predictionService.getTrafficPrediction(selectedCityId);
      }
      setPredictionData(res);
    } catch (err) {
      console.error('Prediction fetch error:', err);
      setError('ML Prediction temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [selectedCityId, predictionType]);

  const metrics = predictionData?.model_metrics;

  return (
    <div className="page-container">
      {/* Header & Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
              Urban Machine Learning & AI Insights
            </h1>
            <span className="metric-origin-tag">scikit-learn + Gemini</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Predictive modeling for <b>{selectedCity?.name}</b> &bull; Grounded strictly on real telemetry & validated ML models
          </p>
        </div>

        {/* Prediction Task Selector */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn ${predictionType === 'flood' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            onClick={() => setPredictionType('flood')}
          >
            Flood Risk Horizon (3-6h)
          </button>
          <button
            className={`btn ${predictionType === 'traffic' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '12px' }}
            onClick={() => setPredictionType('traffic')}
          >
            Traffic Congestion (1h)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <RefreshCw size={24} className="animate-spin" color="#06B6D4" />
          <span className="empty-state-title">Running scikit-learn inference & generating Gemini explanation...</span>
        </div>
      ) : error ? (
        <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', color: '#EF4444' }}>
          <AlertTriangle size={36} style={{ margin: '0 auto 12px' }} />
          <h3>{error}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 6 }}>
            ML prediction unavailable — insufficient training data or connection timeout.
          </p>
          <button className="btn btn-secondary" onClick={fetchPrediction} style={{ marginTop: 16 }}>
            Retry Model Inference
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Machine Learning Model Core Output */}
          <div className="panel" style={{ margin: 0, borderColor: 'var(--border-muted)' }}>
            <div className="panel-header">
              <div className="panel-title">
                <BrainCircuit size={20} color="#06B6D4" />
                <span>Machine Learning Prediction Output</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="metric-origin-tag">Model: {metrics?.algorithm || 'RandomForest'}</span>
                <span className="metric-origin-tag">Horizon: {predictionData.prediction_horizon}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {/* Predicted Risk Level */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Predicted Status
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                    {predictionData.predicted_label}
                  </span>
                  <StatusPill level={predictionData.predicted_label} label={predictionData.predicted_label} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 6 }}>
                  {predictionType === 'flood' ? 'Inundation Probability Horizon' : 'Congestion Volume Index'}
                </div>
              </div>

              {/* Confidence Score */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Model Confidence / Certainty
                </div>
                <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#10B981' }}>
                  {(predictionData.confidence_score * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 6 }}>
                  Derived from scikit-learn class probabilities
                </div>
              </div>

              {/* Current Telemetry Input */}
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Current Telemetry Baseline
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                  {predictionType === 'flood'
                    ? `Rain: ${predictionData.current_condition?.rainfall_1h ?? 0} mm | Temp: ${predictionData.current_condition?.temperature ?? 28}°C`
                    : `Speed: ${predictionData.current_condition?.current_speed ?? 40} km/h | Flow: ${predictionData.current_condition?.free_flow_speed ?? 50} km/h`
                  }
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 6 }}>
                  Input vector at {new Date(predictionData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Feature Importances */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Contributing Feature Importances (Random Forest)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {predictionData.feature_importances?.map((feat, idx) => {
                  const pct = (feat.importance * 100).toFixed(1);
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{feat.feature_name} — <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{feat.description}</span></span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>{pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #06B6D4, #3B82F6)', borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Genuine Model Evaluation Metrics */}
          {metrics && (
            <div className="panel" style={{ margin: 0 }}>
              <div className="panel-header">
                <div className="panel-title">
                  <ShieldCheck size={18} color="#10B981" />
                  <span>Model Evaluation & Validation Benchmark</span>
                </div>
                <span className="metric-origin-tag">scikit-learn holdout test set</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', textAlign: 'center' }}>
                {metrics.accuracy != null && (
                  <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Test Accuracy</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: 2 }}>{(metrics.accuracy * 100).toFixed(2)}%</div>
                  </div>
                )}
                {metrics.f1_score != null && (
                  <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weighted F1-Score</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#06B6D4', marginTop: 2 }}>{metrics.f1_score.toFixed(4)}</div>
                  </div>
                )}
                {metrics.mae != null && (
                  <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mean Absolute Error</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B', marginTop: 2 }}>{metrics.mae.toFixed(4)}</div>
                  </div>
                )}
                {metrics.r2_score != null && (
                  <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>R² Score</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: 2 }}>{metrics.r2_score.toFixed(4)}</div>
                  </div>
                )}
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Training / Test Samples</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                    {metrics.training_samples} / {metrics.test_samples}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: Google Gemini Natural Language Decision Support */}
          <div className="panel" style={{ margin: 0, background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Sparkles size={18} color="#06B6D4" />
                <span>Google Gemini Decision-Support Explanation</span>
              </div>
              <span className="metric-origin-tag">Grounded Reasoning</span>
            </div>

            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line', marginBottom: '16px' }}>
              {predictionData.gemini_explanation}
            </div>

            {/* Recommended Considerations */}
            {predictionData.recommended_considerations && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                  Municipal Operational Considerations
                </h4>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {predictionData.recommended_considerations.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
