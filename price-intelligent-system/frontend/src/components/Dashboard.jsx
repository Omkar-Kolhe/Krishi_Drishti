import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck,
  MoveRight, BarChart2, Cpu, CheckCircle, Sliders, Server
} from 'lucide-react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// ─── MOCK DATA (used when backend is offline) ─────────────────────────────────
const FALLBACK = {
  onion: {
    systemStatus: { modelsOperational: true, lastSync: new Date().toISOString(), market: 'Lasalgaon', state: 'Maharashtra' },
    kpiMetrics: {
      currentPrice:    { value: 2650, unit: 'quintal', perKg: 26.50, market: 'Lasalgaon APMC' },
      forecast7Day:    { value: 2051.16, changePct: -22.60, date: '07 Jan 2025' },
      forecast14Day:   { value: 2106.48, changePct: -20.51, date: '14 Jan 2025' },
      forecast30Day:   { value: 2250.00, changePct: -15.09, date: '30 Jan 2025' },
      riskLevel: 'LOW', alertStatus: 'NORMAL', decisionPriority: 'LOW',
    },
    historicalData: [
      { date: '03 Nov', price: 4300, modelBacktest: 4050, forecast: null },
      { date: '17 Nov', price: 3800, modelBacktest: 3680, forecast: null },
      { date: '01 Dec', price: 3300, modelBacktest: 3150, forecast: null },
      { date: '15 Dec', price: 2900, modelBacktest: 2780, forecast: null },
      { date: '31 Dec', price: 2650, modelBacktest: 2520, forecast: null },
    ],
    forecastData: [
      { date: '31 Dec', price: null, modelBacktest: null, forecast: 2650 },
      { date: '07 Jan', price: null, modelBacktest: null, forecast: 2051 },
      { date: '14 Jan', price: null, modelBacktest: null, forecast: 2106 },
      { date: '30 Jan', price: null, modelBacktest: null, forecast: 2250 },
    ],
    riskData: { score: 19.27, level: 'LOW', earlyWarning: false, drivers: ['Elevated Historical Volatility (daily std dev: 7.83%)', 'Recent supply influx moderating prices'] },
    shapDrivers: [
      { name: 'Current Modal Price', value: 411.61, direction: 'increase' },
      { name: 'Price 3 Days Ago',    value: 78.01,  direction: 'increase' },
      { name: '30-Day Avg Price',    value: -40.42, direction: 'decrease' },
    ],
    modelErrors: { mape7: 15.47, mape14: 19.73, mape30: 36.55, supplyPressureIdx: 21.7 },
    decisionSupport: {
      recommendation: 'ROUTINE MONITORING', priority: 'LOW', confidence: 'HIGH',
      summary: 'Onion shows low price risk over the 7-day horizon. Persistent downward momentum observed.',
      actions:    ['Continue routine market monitoring.', 'Verify retail price margins nationally.'],
      checklists: ['Update weekly market status report.', 'Monitor for early-warning threshold breaches.'],
    },
    sandboxDefaults: { arrivals: 4386, diesel: 94.27, rain: 0.0, arrivalsMin: 1000, arrivalsMax: 13000, baseForecast7d: 2051.16 },
    priceDrivers: [
      { name: 'Price Momentum', value: 35 }, { name: 'Market Arrivals', value: 22 },
      { name: 'Seasonality', value: 18 },    { name: 'Weather Factors', value: 12 },
      { name: 'Other', value: 13 },
    ],
    footerData: { dataSource: 'AGMARKNET & OpenMeteo', lastUpdate: '31 Dec 2024', dataQuality: 99.1, totalRecords: 1200, missingValues: 0.5, modelUsed: 'xgboost_model.pkl', nextUpdate: '01 Jan 2025' },
  },
  potato: {
    systemStatus: { modelsOperational: true, lastSync: new Date().toISOString(), market: 'Achalda', state: 'Uttar Pradesh' },
    kpiMetrics: {
      currentPrice:    { value: 1200, unit: 'quintal', perKg: 12.00, market: 'Achalda APMC' },
      forecast7Day:    { value: 1350, changePct: 12.50, date: '07 Jan 2025' },
      forecast14Day:   { value: 1420, changePct: 18.33, date: '14 Jan 2025' },
      forecast30Day:   { value: 1510, changePct: 25.83, date: '30 Jan 2025' },
      riskLevel: 'MEDIUM', alertStatus: 'NORMAL', decisionPriority: 'MEDIUM',
    },
    historicalData: [
      { date: '03 Nov', price: 900,  forecast: null }, { date: '17 Nov', price: 950, forecast: null },
      { date: '01 Dec', price: 1050, forecast: null }, { date: '15 Dec', price: 1130, forecast: null },
      { date: '31 Dec', price: 1200, forecast: null },
    ],
    forecastData: [
      { date: '31 Dec', price: null, forecast: 1200 }, { date: '07 Jan', price: null, forecast: 1350 },
      { date: '14 Jan', price: null, forecast: 1420 }, { date: '30 Jan', price: null, forecast: 1510 },
    ],
    riskData: { score: 38.5, level: 'MEDIUM', earlyWarning: false, drivers: ['Price momentum turning upward (7.83%)', 'Seasonal demand spike approaching'] },
    shapDrivers: [
      { name: 'Price 7 Days Ago', value: 220.5,  direction: 'increase' },
      { name: 'Rolling Mean 7d',  value: 155.0,  direction: 'increase' },
      { name: 'Market Arrivals',  value: -45.20, direction: 'decrease' },
    ],
    modelErrors: { mape7: 16.19, mape14: 33.33, mape30: 67.30, supplyPressureIdx: 33.5 },
    decisionSupport: {
      recommendation: 'INTERVENTION WATCH', priority: 'MEDIUM', confidence: 'HIGH',
      summary: 'Potato prices trending upward. Seasonal demand pressure approaching. Monitor closely.',
      actions:    ['Prepare buffer stock release plan.', 'Monitor market arrivals daily.'],
      checklists: ['Confirm arrival data from AGMARKNET.', 'Check seasonal demand patterns.'],
    },
    sandboxDefaults: { arrivals: 3200, diesel: 94.27, rain: 5.0, arrivalsMin: 800, arrivalsMax: 9600, baseForecast7d: 1350 },
    priceDrivers: [
      { name: 'Price Momentum', value: 30 }, { name: 'Seasonality', value: 25 },
      { name: 'Market Arrivals', value: 20 }, { name: 'Weather', value: 15 }, { name: 'Other', value: 10 },
    ],
    footerData: { dataSource: 'AGMARKNET & OpenMeteo', lastUpdate: '31 Dec 2024', dataQuality: 98.5, totalRecords: 980, missingValues: 0.8, modelUsed: 'potato_model.pkl', nextUpdate: '01 Jan 2025' },
  },
  turdal: {
    systemStatus: { modelsOperational: true, lastSync: new Date().toISOString(), market: 'Latur', state: 'Maharashtra' },
    kpiMetrics: {
      currentPrice:    { value: 8500, unit: 'quintal', perKg: 85.00, market: 'Latur APMC' },
      forecast7Day:    { value: 8350, changePct: -1.76, date: '07 Jan 2025' },
      forecast14Day:   { value: 8220, changePct: -3.29, date: '14 Jan 2025' },
      forecast30Day:   { value: 8100, changePct: -4.71, date: '30 Jan 2025' },
      riskLevel: 'LOW', alertStatus: 'NORMAL', decisionPriority: 'LOW',
    },
    historicalData: [
      { date: '03 Nov', price: 8900, forecast: null }, { date: '17 Nov', price: 8750, forecast: null },
      { date: '01 Dec', price: 8600, forecast: null }, { date: '15 Dec', price: 8520, forecast: null },
      { date: '31 Dec', price: 8500, forecast: null },
    ],
    forecastData: [
      { date: '31 Dec', price: null, forecast: 8500 }, { date: '07 Jan', price: null, forecast: 8350 },
      { date: '14 Jan', price: null, forecast: 8220 }, { date: '30 Jan', price: null, forecast: 8100 },
    ],
    riskData: { score: 11.5, level: 'LOW', earlyWarning: false, drivers: ['Stable supply chain from Latur region', 'Prices within 5% of 30-day moving average'] },
    shapDrivers: [
      { name: 'Rolling Mean 30d',  value: 310.5,  direction: 'increase' },
      { name: 'Price 7 Days Ago',  value: -85.20, direction: 'decrease' },
      { name: 'Market Arrivals',   value: -30.10, direction: 'decrease' },
    ],
    modelErrors: { mape7: 7.30, mape14: 9.17, mape30: 13.32, supplyPressureIdx: 9.8 },
    decisionSupport: {
      recommendation: 'ROUTINE MONITORING', priority: 'LOW', confidence: 'HIGH',
      summary: 'Tur Dal prices are stable with gradual decline. No intervention required at this time.',
      actions:    ['Continue routine market monitoring.', 'Update procurement targets for Q1.'],
      checklists: ['Monitor crop status in Latur and Bidar districts.', 'Verify import pipeline from Myanmar.'],
    },
    sandboxDefaults: { arrivals: 1800, diesel: 94.27, rain: 0.0, arrivalsMin: 500, arrivalsMax: 5400, baseForecast7d: 8350 },
    priceDrivers: [
      { name: 'Rolling Mean', value: 40 }, { name: 'Price Momentum', value: 28 },
      { name: 'Arrivals', value: 18 }, { name: 'Seasonality', value: 9 }, { name: 'Weather', value: 5 },
    ],
    footerData: { dataSource: 'AGMARKNET & OpenMeteo', lastUpdate: '31 Dec 2024', dataQuality: 97.8, totalRecords: 850, missingValues: 1.2, modelUsed: 'turdal_model.pkl', nextUpdate: '01 Jan 2025' },
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
const pctBadge  = (pct) => {
  const isNeg = pct < 0;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded inline-flex items-center gap-0.5 ${isNeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {isNeg ? <TrendingDown size={11}/> : <TrendingUp size={11}/>}
      {pct > 0 ? '+' : ''}{pct?.toFixed(2)}%
    </span>
  );
};
const riskColors = { LOW: 'green', MEDIUM: 'yellow', HIGH: 'orange', URGENT: 'red' };
const riskBg     = { LOW: 'bg-green-50 border-green-100', MEDIUM: 'bg-yellow-50 border-yellow-100', HIGH: 'bg-orange-50 border-orange-100', URGENT: 'bg-red-50 border-red-100' };
const riskText   = { LOW: 'text-green-800', MEDIUM: 'text-yellow-800', HIGH: 'text-orange-800', URGENT: 'text-red-800' };
const riskBadge  = { LOW: 'bg-green-200 text-green-900 border-green-300', MEDIUM: 'bg-yellow-200 text-yellow-900 border-yellow-300', HIGH: 'bg-orange-200 text-orange-900 border-orange-300', URGENT: 'bg-red-200 text-red-900 border-red-300' };

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Dashboard = ({ data, selectedCommodity = 'onion' }) => {
  // Merge live API data over the appropriate fallback (so offline mode is per-commodity)
  const fallback = FALLBACK[selectedCommodity] || FALLBACK.onion;
  const d = {
    systemStatus:    data?.systemStatus    || fallback.systemStatus,
    kpiMetrics:      data?.kpiMetrics      || fallback.kpiMetrics,
    historicalData:  data?.historicalData  || fallback.historicalData,
    forecastData:    data?.forecastData    || fallback.forecastData,
    riskData:        data?.riskData        || fallback.riskData,
    shapDrivers:     data?.shapDrivers     || fallback.shapDrivers,
    modelErrors:     data?.modelErrors     || fallback.modelErrors,
    decisionSupport: data?.decisionSupport || fallback.decisionSupport,
    sandboxDefaults: data?.sandboxDefaults || fallback.sandboxDefaults,
    priceDrivers:    data?.priceDrivers    || fallback.priceDrivers,
    footerData:      data?.footerData      || fallback.footerData,
  };

  const [sandbox, setSandbox] = useState(d.sandboxDefaults);

  // Simple client-side simulation: linear perturbation of baseForecast
  const base = d.sandboxDefaults.baseForecast7d || d.kpiMetrics.forecast7Day?.value || 0;
  const simPrice = Math.max(0,
    base
    - ((sandbox.arrivals - d.sandboxDefaults.arrivals) * 0.04)
    + ((sandbox.diesel   - d.sandboxDefaults.diesel)   * 3.5)
    - (sandbox.rain * 2.0)
  );
  const simImpact = base - simPrice;
  const simPct    = d.kpiMetrics.currentPrice?.value
    ? ((simPrice - d.kpiMetrics.currentPrice.value) / d.kpiMetrics.currentPrice.value * 100)
    : 0;

  const rl = d.riskData?.level || 'LOW';

  const combinedChart = [...(d.historicalData || []), ...(d.forecastData || [])];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">National Price Intelligence & DSS</h1>
        <p className="text-sm font-semibold text-[#0A3A2A] mt-1">AI-Enabled Commodity Price Forecasting & Buffer Stock Intervention Sandbox</p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">Government of India — Department of Consumer Affairs &nbsp;|&nbsp; Market: {d.systemStatus?.market} ({d.systemStatus?.state})</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          1. EXECUTIVE SUMMARY
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="1. Executive Summary: Market Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* Current Price */}
          <KpiCard label="Current Wholesale Price">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.currentPrice?.value)}</p>
            <p className="text-xs text-gray-400 mt-1 font-semibold">₹{d.kpiMetrics.currentPrice?.perKg} /kg · {d.kpiMetrics.currentPrice?.market}</p>
          </KpiCard>

          {/* 7-Day */}
          <KpiCard label="7-Day Forecast">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.forecast7Day?.value)}</p>
            <div className="mt-1">{pctBadge(d.kpiMetrics.forecast7Day?.changePct)}</div>
          </KpiCard>

          {/* 14-Day */}
          <KpiCard label="14-Day Forecast">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.forecast14Day?.value)}</p>
            <div className="mt-1">{pctBadge(d.kpiMetrics.forecast14Day?.changePct)}</div>
          </KpiCard>

          {/* 30-Day */}
          <KpiCard label="30-Day Forecast">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.forecast30Day?.value)}</p>
            <div className="mt-1">{pctBadge(d.kpiMetrics.forecast30Day?.changePct)}</div>
          </KpiCard>

          {/* System Status */}
          <div className="bg-[#0A3A2A] text-white rounded-xl p-5 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest mb-3">System Status</p>
            <div className="space-y-2">
              <Row label="Risk Level">
                <span className={`font-black text-sm tracking-wider ${rl === 'LOW' ? 'text-green-400' : rl === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}`}>{rl}</span>
              </Row>
              <Row label="Alert Status">
                <span className="font-black text-sm text-white">{d.kpiMetrics.alertStatus === 'ALERT' ? '🚨 ALERT' : '🟢 NORMAL'}</span>
              </Row>
              <Row label="Decision Priority">
                <span className="font-black text-sm text-white">{d.kpiMetrics.decisionPriority}</span>
              </Row>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. PRICE TRAJECTORY
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="2. Price Trajectory & Multi-Horizon Forecast">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h3 className="font-bold text-gray-800">Wholesale Price Trajectory — Backtest Validation & Multi-Horizon Forecast</h3>
            <div className="flex gap-5 flex-wrap">
              <Legend color="#3b82f6" label="Actual Historical Price" />
              <Legend color="#16a34a" label="Model Backtest (In-Sample)" dashed />
              <Legend color="#ef4444" label="Model Forecast (Future)" dashed />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedChart} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)', fontWeight: 600 }} formatter={(v) => [formatINR(v)]} />
                {/* Actual historical price — solid blue */}
                <Line type="monotone" dataKey="price" name="Actual Price" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6' }} connectNulls />
                {/* Model backtest — dashed green (what model predicted in-sample) */}
                <Line type="monotone" dataKey="modelBacktest" name="Model Backtest" stroke="#16a34a" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 5, fill: '#16a34a' }} connectNulls />
                {/* Future forecast — dashed red */}
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="6 3" dot={{ r: 5, fill: '#fff', stroke: '#ef4444', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#ef4444' }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Model Error Strip */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-4 gap-4 text-center">
            <MapeCell label="7-Day MAPE"        value={`${d.modelErrors?.mape7}%`}  />
            <MapeCell label="14-Day MAPE"       value={`${d.modelErrors?.mape14}%`} />
            <MapeCell label="30-Day MAPE"       value={`${d.modelErrors?.mape30}%`} />
            <MapeCell label="Supply Pressure Idx" value={d.modelErrors?.supplyPressureIdx?.toFixed(1)} accent />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          3 & 4. RISK + SHAP
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. Early Warning */}
        <div>
          <SectionTitle title="3. Early Warning & Risk Analysis" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <div className={`p-5 rounded-xl mb-5 border ${riskBg[rl]}`}>
              <div className="flex items-center gap-4">
                {rl === 'LOW' || rl === 'MEDIUM'
                  ? <ShieldCheck size={40} className={rl === 'LOW' ? 'text-green-600' : 'text-yellow-600'} />
                  : <AlertTriangle size={40} className="text-red-600" />}
                <div>
                  <p className={`text-4xl font-black ${riskText[rl]} leading-none`}>{d.riskData?.score}</p>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${riskText[rl]}`}>
                    Score / 100 &nbsp;·&nbsp; {rl} RISK &nbsp;·&nbsp; Warning {d.riskData?.earlyWarning ? 'ACTIVE' : 'INACTIVE'}
                  </p>
                </div>
              </div>
            </div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Core Risk Drivers:</h4>
            <ul className="space-y-3">
              {(d.riskData?.drivers || []).map((dr, i) => (
                <li key={i} className="flex items-start text-sm font-medium text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 mr-3 flex-shrink-0" />
                  {dr}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. SHAP Explainability */}
        <div>
          <SectionTitle title="4. Price Driver Explainability (SHAP)" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <p className="text-[11px] text-gray-400 italic mb-5 font-medium">Local feature contribution relative to baseline. Does not imply physical causation.</p>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.shapDrivers} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} formatter={(v) => [`₹${v}`, 'Impact']} />
                  <Bar dataKey="value" barSize={22} radius={[0, 4, 4, 0]}>
                    {(d.shapDrivers || []).map((e, i) => (
                      <Cell key={`c-${i}`} fill={e.direction === 'increase' ? '#16a34a' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-3 text-xs font-bold">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-600"></div>Price Upward Driver</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500"></div>Price Downward Driver</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5. DECISION SUPPORT
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="5. Government Decision Support">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-[11px] text-gray-400 italic mb-6 font-medium">Advisory decision support for policy analysts. Not an autonomous action mandate.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Assessment */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Cpu size={18} className="text-blue-600 flex-shrink-0" />
                <h4 className="font-bold text-gray-900">Model Assessment</h4>
              </div>
              <div className={`${riskBg[rl]} border rounded-xl p-4 mb-4`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${riskText[rl]}`}>Recommendation</p>
                <p className={`text-lg font-black ${riskText[rl]} mb-2`}>{d.decisionSupport?.recommendation}</p>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">{d.decisionSupport?.summary}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Action Directives</h5>
                <ul className="space-y-1.5">
                  {(d.decisionSupport?.actions || []).map((a, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700 font-medium">
                      <span className="text-blue-500 mr-2 font-black">✦</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Checklists */}
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                  <h4 className="font-bold text-gray-900">Analyst Verification Checkpoints</h4>
                </div>
                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded border ${riskBadge[rl]}`}>
                  Confidence: {d.decisionSupport?.confidence}
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Verify Before Action:</p>
              <ul className="space-y-3 mb-6">
                {(d.decisionSupport?.checklists || []).map((c, i) => (
                  <li key={i} className="flex items-start text-sm text-gray-700 font-medium">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded mr-3 mt-0.5 flex-shrink-0"></div>
                    {c}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-[#0A3A2A] hover:bg-green-900 text-white py-3 rounded-xl text-sm font-bold transition shadow-sm flex justify-center items-center gap-2">
                View Full Evidence Log <MoveRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          6 & 7. MODEL RELIABILITY + POLICY SANDBOX
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 6. Model Reliability */}
        <div>
          <SectionTitle title="6. Model Reliability & Transparency" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Server size={16} className="text-purple-600" />
                <h4 className="font-bold text-gray-900 text-sm">Model Error Margins (MAPE)</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MapeCard label="7-Day" value={`${d.modelErrors?.mape7}%`} />
                <MapeCard label="14-Day" value={`${d.modelErrors?.mape14}%`} />
                <MapeCard label="30-Day" value={`${d.modelErrors?.mape30}%`} />
              </div>
            </div>

            {/* Feature importance bar chart */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Top Feature Importances</h4>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={d.priceDrivers} margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barSize={10}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#4b5563', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: 11, fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,.1)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {(d.priceDrivers || []).map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#0A3A2A' : '#22c55e'} opacity={1 - i * 0.14} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-xs font-medium text-purple-900 leading-relaxed">
              <strong>Interpretation:</strong> Longer-horizon forecasts carry higher error. Use 30-day forecasts as directional signals, not precise price targets.
            </div>
          </div>
        </div>

        {/* 7. Policy Sandbox */}
        <div>
          <SectionTitle title="7. Policy Intervention Sandbox" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Sliders size={16} className="text-orange-600" />
                <h4 className="font-bold text-gray-900 text-sm">Adjust Supply / Market Parameters</h4>
              </div>
              <div className="space-y-6">
                <SliderField
                  label="Simulate Market Arrivals (Tonnes)"
                  value={sandbox.arrivals}
                  min={d.sandboxDefaults.arrivalsMin}
                  max={d.sandboxDefaults.arrivalsMax}
                  step={100}
                  onChange={(v) => setSandbox({ ...sandbox, arrivals: v })}
                  display={`${sandbox.arrivals} T`}
                />
                <SliderField
                  label="Simulate Diesel Price Shock (₹/L)"
                  value={sandbox.diesel}
                  min={70}
                  max={110}
                  step={0.5}
                  onChange={(v) => setSandbox({ ...sandbox, diesel: v })}
                  display={`₹${sandbox.diesel}`}
                />
                <SliderField
                  label="Simulate Rainfall Deficit / Excess (mm)"
                  value={sandbox.rain}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => setSandbox({ ...sandbox, rain: v })}
                  display={`${sandbox.rain} mm`}
                />
              </div>
            </div>

            {/* Simulation Result */}
            <div className="mt-8 bg-gray-50 border border-gray-200 p-5 rounded-xl text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Simulated 7-Day Forecast Price</p>
              <p className="text-4xl font-black text-gray-900 mb-2">{formatINR(simPrice)}</p>
              {simImpact > 5 ? (
                <p className="text-sm font-bold text-green-600">💡 Intervention drops forecast by {formatINR(simImpact)}</p>
              ) : simImpact < -5 ? (
                <p className="text-sm font-bold text-red-600">⚠️ Supply constraints push forecast up by {formatINR(Math.abs(simImpact))}</p>
              ) : (
                <p className="text-sm font-bold text-gray-500">No significant impact simulated.</p>
              )}
              {simPct > 10 && <p className="text-xs text-red-700 font-bold mt-2">URGENT: Consider evaluating buffer stock release.</p>}
              {simPct > 5 && simPct <= 10 && <p className="text-xs text-orange-700 font-bold mt-2">MONITOR: Consider partial buffer stock release or import options.</p>}
              {simPct < -10 && <p className="text-xs text-green-700 font-bold mt-2">BUY: Assess procurement readiness for buffer stock build-up.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          8. SYSTEM ARCHITECTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="pb-10">
        <SectionTitle title="8. System Architecture Flow" />
        <div className="bg-[#0A3A2A] text-green-300 rounded-xl p-6 font-mono text-[11px] leading-loose shadow-sm overflow-x-auto whitespace-pre">
{`Data Layer (AGMARKNET · OpenMeteo · Diesel Price API)
       ↓
Feature Engineering (Lags, Rolling Averages, Volatility Metrics)
       ↓
Multi-Horizon Forecasting Engine (7D · 14D · 30D XGBoost Regressors)
       ↓
Risk & Early-Warning Engine (Composite Score · Arrival Pressure · Volatility)
       ↓
SHAP Explainability Engine (Local Feature Contribution Mapping)
       ↓
Decision-Support Engine (Advisory Policies · Verification Checklists · DSS)
       ↓
Policy Sandbox (What-If Simulation · Buffer Stock Impact Analysis)`}
        </div>
        <div className="mt-4 text-xs text-gray-400 flex gap-6 flex-wrap font-medium">
          <span>📡 Data Source: {d.footerData?.dataSource}</span>
          <span>📅 Last Update: {d.footerData?.lastUpdate}</span>
          <span>✅ Data Quality: {d.footerData?.dataQuality}%</span>
          <span>📊 Total Records: {d.footerData?.totalRecords?.toLocaleString()}</span>
          <span>🤖 Model: {d.footerData?.modelUsed}</span>
        </div>
      </div>
    </div>
  );
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div>
    <SectionTitle title={title} />
    {children}
  </div>
);

const SectionTitle = ({ title }) => (
  <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">{title}</h2>
);

const KpiCard = ({ label, children }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between gap-2">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    {children}
  </div>
);

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[10px] text-green-200 uppercase tracking-wider font-bold">{label}:</span>
    {children}
  </div>
);

const Legend = ({ color, label, dashed }) => (
  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
    <span style={{ backgroundColor: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : 'none', display: 'inline-block', width: 14, height: dashed ? 0 : 12, borderRadius: 2 }}></span>
    {label}
  </span>
);

const MapeCell = ({ label, value, accent }) => (
  <div className="text-center">
    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</p>
    <p className={`text-lg font-black ${accent ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
  </div>
);

const MapeCard = ({ label, value }) => (
  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-black text-gray-900">{value}</p>
  </div>
);

const SliderField = ({ label, value, min, max, step, onChange, display }) => (
  <div>
    <div className="flex justify-between mb-2">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</label>
      <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">{display}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
    />
  </div>
);

export default Dashboard;
