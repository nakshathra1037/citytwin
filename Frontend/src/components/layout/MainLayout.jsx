import React, { useState } from 'react';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { ChatbotDrawer } from '../chatbot/ChatbotDrawer';
import { DashboardPage } from '../../pages/DashboardPage';
import { DigitalTwinPage } from '../../pages/DigitalTwinPage';
import { AnalyticsPage } from '../../pages/AnalyticsPage';
import { PredictionPage } from '../../pages/PredictionPage';
import { SimulationPage } from '../../pages/SimulationPage';

export const MainLayout = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'digital-twin':
        return <DigitalTwinPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'prediction':
        return <PredictionPage />;
      case 'simulation':
        return <SimulationPage />;
      default:
        return <DashboardPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Command Center Area */}
      <div className="main-content">
        {/* Top Header */}
        <Header />

        {/* Dynamic Page Content */}
        <main style={{ flex: 1 }}>
          {renderActivePage()}
        </main>
      </div>

      {/* Floating Urban AI Assistant Drawer (Available Everywhere) */}
      <ChatbotDrawer activePage={activePage} />
    </div>
  );
};
