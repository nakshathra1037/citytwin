import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Globe2, 
  LineChart, 
  BrainCircuit, 
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = ({ activePage, setActivePage }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'digital-twin', label: 'Live Digital Twin', icon: Globe2 },
    { id: 'analytics', label: 'Analytics & Trends', icon: LineChart },
    { id: 'prediction', label: 'Prediction & AI', icon: BrainCircuit },
    { id: 'simulation', label: 'What-If Simulation', icon: SlidersHorizontal },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
              style={{ width: '100%', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Municipal Officer'}</span>
            <span className="user-role">
              <ShieldCheck size={11} style={{ display: 'inline', marginRight: 4, color: '#10B981' }} />
              {user?.role?.replace('_', ' ') || 'Urban Planner'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
