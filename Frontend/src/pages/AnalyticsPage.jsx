import React, { useState, useEffect } from 'react';
import { useCity } from '../context/CityContext';
import { analyticsService } from '../services/analyticsService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LineChart, Database, AlertCircle, RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsPage = () => {
  const { selectedCityId, selectedCity } = useCity();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getAnalytics(selectedCityId, 40);
      setData(res);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Unable to load analytics archive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCityId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <RefreshCw size={24} className="animate-spin" color="#06B6D4" />
          <span className="empty-state-title">Retrieving MongoDB Observations...</span>
        </div>
      </div>
    );
  }

  const isInsufficient = data?.status === 'insufficient_data' || (data?.series?.timestamps?.length || 0) < 2;

  if (isInsufficient) {
    return (
      <div className="page-container">
        <div className="panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Database size={40} color="#06B6D4" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Collecting data for analytics</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '440px', margin: '8px auto 20px' }}>
            Historical observations for <b>{selectedCity?.name}</b> are currently being logged. In accordance with the strict data policy, trends are only plotted from verified MongoDB observations.
          </p>
          <button className="btn btn-secondary" onClick={fetchAnalytics}>
            <RefreshCw size={14} />
            <span>Check for New Records</span>
          </button>
        </div>
      </div>
    );
  }

  const timestamps = data.series.timestamps;

  // Chart 1: Temperature & Rainfall
  const weatherChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: data.series.temperature,
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
        fill: false
      },
      {
        label: 'Rainfall (mm/h)',
        data: data.series.rainfall,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        yAxisID: 'y1',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Chart 2: Traffic Congestion & Flood Risk
  const riskChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Traffic Congestion (%)',
        data: data.series.traffic_congestion,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3,
        fill: false
      },
      {
        label: 'Derived Flood Risk Score (0-100)',
        data: data.series.flood_risk_score,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Chart 3: City Health Score
  const healthChartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'City Health Score (0-100)',
        data: data.series.city_health_score,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94A3B8',
          font: { family: 'Inter', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#0E1524',
        borderColor: '#1E2D4A',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8'
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748B', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748B', font: { size: 10 } }
      }
    }
  };

  const weatherOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Temperature (°C)', color: '#06B6D4' },
        ticks: { color: '#64748B' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Rainfall (mm/h)', color: '#3B82F6' },
        grid: { drawOnChartArea: false },
        ticks: { color: '#64748B' }
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
            {selectedCity?.name} Historical Analytics & Trends
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Actual observations stored in MongoDB &bull; Total records: <b>{data.observations_count}</b>
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchAnalytics}>
          <RefreshCw size={13} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Chart Panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Panel 1: Temperature & Rainfall */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <LineChart size={18} color="#06B6D4" />
              <span>Meteorological Trends: Temperature vs Precipitation</span>
            </div>
            <span className="metric-origin-tag">MongoDB Archives</span>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <Line data={weatherChartData} options={weatherOptions} />
          </div>
        </div>

        {/* Panel 2: Traffic vs Flood Risk */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <LineChart size={18} color="#F59E0B" />
              <span>Urban Stress: Traffic Congestion vs Derived Flood Risk</span>
            </div>
            <span className="metric-origin-tag">TomTom + Derived Indicators</span>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <Line data={riskChartData} options={commonOptions} />
          </div>
        </div>

        {/* Panel 3: City Health Progression */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <LineChart size={18} color="#10B981" />
              <span>City Health Score Progression</span>
            </div>
            <span className="metric-origin-tag">Deterministic Model</span>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <Line data={healthChartData} options={commonOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
