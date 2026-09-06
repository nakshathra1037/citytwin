import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { LoginPage } from './pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { RefreshCw } from 'lucide-react';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        gap: '16px'
      }}>
        <RefreshCw size={28} className="animate-spin" color="#06B6D4" />
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>INITIALIZING LIVING CITY CORE SERVICES...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <CityProvider>
      <TelemetryProvider>
        <MainLayout />
      </TelemetryProvider>
    </CityProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
