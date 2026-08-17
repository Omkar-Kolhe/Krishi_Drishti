import React from 'react';
import { Bell, Calendar, ChevronDown } from 'lucide-react';

// Commodity config — matches backend COMMODITY_CONFIG keys exactly
const COMMODITIES = [
  { key: 'onion',  label: 'Onion',    emoji: '🧅', market: 'Lasalgaon',  state: 'Maharashtra' },
  { key: 'potato', label: 'Potato',   emoji: '🥔', market: 'Achalda',    state: 'Uttar Pradesh' },
  { key: 'turdal', label: 'Tur Dal',  emoji: '🫘', market: 'Latur',      state: 'Maharashtra' },
];

const FORECAST_HORIZONS = ['7 Days', '14 Days', '30 Days'];

const TopBar = ({ selectedCommodity = 'onion', onCommodityChange }) => {
  const activeCommodity = COMMODITIES.find(c => c.key === selectedCommodity) || COMMODITIES[0];
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white px-6 py-3.5 flex items-center justify-between shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="flex items-center gap-5 flex-wrap">

        {/* Commodity Selector — functional, wired to App state */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Commodity</span>
          <div className="relative">
            <select
              value={selectedCommodity}
              onChange={(e) => onCommodityChange?.(e.target.value)}
              className="appearance-none border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-sm font-semibold bg-white text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent shadow-sm"
            >
              {COMMODITIES.map(c => (
                <option key={c.key} value={c.key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* State — derived from selected commodity */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">State</span>
          <div className="border border-gray-200 rounded-md px-3 py-1.5 text-sm font-semibold bg-gray-50 text-gray-700">
            {activeCommodity.state}
          </div>
        </div>

        {/* Market — derived from selected commodity */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Market</span>
          <div className="border border-gray-200 rounded-md px-3 py-1.5 text-sm font-semibold bg-gray-50 text-gray-700">
            {activeCommodity.market}
          </div>
        </div>

        {/* Forecast Horizon — static display (future: make functional) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Forecast Horizon</span>
          <div className="relative">
            <select className="appearance-none border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-sm font-semibold bg-white text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent shadow-sm">
              {FORECAST_HORIZONS.map(h => (
                <option key={h}>{h}</option>
              ))}
            </select>
            <ChevronDown size={13} className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-4">
        <div className="border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm font-medium bg-white text-gray-600">
          <Calendar size={13} className="text-gray-400" />
          {today}
        </div>

        <div className="relative">
          <Bell className="text-gray-500 cursor-pointer hover:text-gray-800 transition" size={20} />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </div>

        <button className="bg-krishi-dark hover:bg-green-900 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
          <span className="text-base">📄</span>
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default TopBar;
