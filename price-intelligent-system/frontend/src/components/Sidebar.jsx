import React from 'react';
import { Home, BarChart2, Activity, Cpu, ShieldCheck, Leaf, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { icon: <Home size={18} />,          label: 'Overview',              active: true,  section: 'dashboard' },
  { icon: <BarChart2 size={18} />,     label: 'Price Intelligence',    active: false, section: 'dashboard' },
  { icon: <Activity size={18} className="text-red-400" />, label: 'Risk & Early Warning', active: false, section: 'dashboard' },
  { icon: <Cpu size={18} />,           label: 'Forecast Explainability', active: false, section: 'dashboard' },
  { icon: <ShieldCheck size={18} />,   label: 'Model Accuracy',        active: false, section: 'tools' },
  { icon: <FileText size={18} />,      label: 'Decision Support',      active: false, section: 'tools' },
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

        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-6 mb-2">Analytics</p>
        <ul className="space-y-0.5">
          {toolItems.map(renderItem)}
        </ul>
      </nav>

      {/* Powered By footer (replacing System Status) */}
      <div className="p-5 border-t border-white/10">
        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
          Powered by XGBoost Multi-Horizon Forecasting
          <br />Data Source: AGMARKNET & OpenMeteo
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
