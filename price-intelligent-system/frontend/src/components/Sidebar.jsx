import React from 'react';
import { Home, BarChart2, Activity, Map, Cpu, FlaskConical, ShieldCheck, Leaf } from 'lucide-react';

const NAV_ITEMS = [
  { icon: <Home size={18} />,          label: 'Overview',          active: true,  section: 'dashboard' },
  { icon: <BarChart2 size={18} />,     label: 'Price Intelligence', active: false, section: 'dashboard' },
  { icon: <Activity size={18} className="text-red-400" />, label: 'Risk & Alerts', active: false, section: 'dashboard' },
  { icon: <Map size={18} />,           label: 'Market Intelligence',active: false, section: 'dashboard' },
  { icon: <Cpu size={18} />,           label: 'Explainable AI',    active: false, section: 'dashboard' },
  { icon: <FlaskConical size={18} />,  label: 'Policy Sandbox',    active: false, section: 'tools' },
  { icon: <ShieldCheck size={18} />,   label: 'Model Reliability', active: false, section: 'tools' },
];

const Sidebar = () => {
  const dashboardItems = NAV_ITEMS.filter(i => i.section === 'dashboard');
  const toolItems      = NAV_ITEMS.filter(i => i.section === 'tools');

  const renderItem = (item, index) => (
    <li key={index}>
      <a
        href="#"
        className={`flex items-center gap-3 px-6 py-3 text-sm transition-all duration-150 ${
          item.active
            ? 'bg-green-700/60 border-l-4 border-green-400 font-semibold text-white'
            : 'hover:bg-white/10 text-gray-300 hover:text-white border-l-4 border-transparent'
        }`}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {item.label}
      </a>
    </li>
  );

  return (
    <aside className="w-64 bg-krishi-dark text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-20">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-xl font-bold mb-0.5">
          <span>KrishiDrishti</span>
          <Leaf className="text-green-400" size={22} />
        </div>
        <p className="text-[11px] text-gray-400 font-medium tracking-wide">AI-Powered Price Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-6 mb-2">Dashboard</p>
        <ul className="space-y-0.5 mb-6">
          {dashboardItems.map(renderItem)}
        </ul>

        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-6 mb-2">Tools</p>
        <ul className="space-y-0.5">
          {toolItems.map(renderItem)}
        </ul>
      </nav>

      {/* System Status */}
      <div className="p-5 border-t border-white/10">
        <h3 className="text-[10px] font-bold text-gray-500 mb-3 tracking-widest uppercase">System Status</h3>
        <div className="space-y-3 text-xs text-gray-300">
          {[
            { label: 'All Models Operational', sub: 'XGBoost v2.1' },
            { label: 'Forecast Engine',         sub: 'Active — 3 commodities' },
            { label: 'Data Pipeline',            sub: 'AGMARKNET · Live' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-1 flex-shrink-0 animate-pulse" />
              <div>
                <p className="font-semibold text-white text-[11px]">{s.label}</p>
                <p className="text-gray-400 mt-0.5 text-[10px]">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
