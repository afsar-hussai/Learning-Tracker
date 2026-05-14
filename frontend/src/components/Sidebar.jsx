import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Code2, BookOpen, Building2, Award,
  Target, FileText, Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dsa', icon: Code2, label: 'DSA Tracker' },
  { to: '/skills', icon: BookOpen, label: 'Skills & Roadmap' },
  { to: '/apexbank', icon: Building2, label: 'Apex Bank' },
  { to: '/certifications', icon: Award, label: 'Certifications' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/journal', icon: FileText, label: 'Journal' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="flex flex-col border-r border-[#1E1E2E] transition-all duration-300"
      style={{ width: collapsed ? 64 : 220, background: '#0D0D15', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-[#1E1E2E]">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,255,156,0.15)', border: '1px solid rgba(0,255,156,0.3)' }}>
          <Zap size={16} color="#00FF9C" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-xs font-mono font-bold text-[#00FF9C] leading-tight">Learning OS</div>
            <div className="text-[10px] text-gray-500">Afsar's Journey</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {!collapsed && <span className="truncate text-xs">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-[#1E1E2E] text-gray-500 hover:text-[#00FF9C] transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );
}
