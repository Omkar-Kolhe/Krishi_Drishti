import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck,
  MoveRight, BarChart2, Cpu, CheckCircle, Info, ArrowUpRight, ArrowDownRight, Minus, Settings2
} from 'lucide-react';
import { simulateForecast } from '../api';
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
      { date: '03 Nov', price: 4300, forecast: null },
      { date: '17 Nov', price: 3800, forecast: null },
      { date: '01 Dec', price: 3300, forecast: null },
      { date: '15 Dec', price: 2900, forecast: null },
      { date: '31 Dec', price: 2650, forecast: null },
    ],
    forecastData: [
      { date: '31 Dec', price: null, forecast: 2650 },
      { date: '07 Jan', price: null, forecast: 2051 },
      { date: '14 Jan', price: null, forecast: 2106 },
      { date: '30 Jan', price: null, forecast: 2250 },
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
const riskBg     = { LOW: 'bg-green-50 border-green-100', MEDIUM: 'bg-yellow-50 border-yellow-100', HIGH: 'bg-orange-50 border-orange-100', URGENT: 'bg-red-50 border-red-100' };
const riskText   = { LOW: 'text-green-800', MEDIUM: 'text-yellow-800', HIGH: 'text-orange-800', URGENT: 'text-red-800' };
const riskBadge  = { LOW: 'bg-green-200 text-green-900 border-green-300', MEDIUM: 'bg-yellow-200 text-yellow-900 border-yellow-300', HIGH: 'bg-orange-200 text-orange-900 border-orange-300', URGENT: 'bg-red-200 text-red-900 border-red-300' };

// Decision Priority explanations
const PRIORITY_EXPLANATIONS = {
  LOW:    'No immediate action required. Markets are operating within normal bounds. Continue routine monitoring.',
  MEDIUM: 'Situation requires closer monitoring. Early signs of price movement detected. Prepare contingency plans.',
  HIGH:   'Significant price movement expected. Initiate preparatory actions for buffer stock management and market intervention.',
  URGENT: 'Critical threshold breached. Immediate policy intervention likely needed — buffer stock release, import facilitation, or market advisory.',
};

// Risk score explanation
const RISK_SCORE_EXPLANATION = 'Composite score (0–100) computed from: forecast price change (weighted 1.5×), historical price volatility (weighted 0.8×), and market arrival deviation from 30-day average (weighted 0.3×). Score ≥ 40 triggers an early warning.';

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Dashboard = ({ data, selectedCommodity = 'onion', onActiveSectionChange }) => {
  const [simParams, setSimParams] = useState({ arrivals: 0, diesel: 0, rain: 0 });
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState(null);
  const [hasInitializedSim, setHasInitializedSim] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState('30d');

  useEffect(() => {
    if (!onActiveSectionChange) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const mostVisible = visibleEntries.reduce((prev, current) => 
            (prev.intersectionRatio > current.intersectionRatio) ? prev : current
          );
          onActiveSectionChange(mostVisible.target.id);
        }
      },
      {
        root: null,
        rootMargin: '-100px 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const sectionIds = ['overview', 'price-intelligence', 'risk-warning', 'forecast-explainability', 'model-accuracy', 'decision-support'];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [onActiveSectionChange, data, selectedCommodity]);

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
    priceDrivers:    data?.priceDrivers    || fallback.priceDrivers,
    sandboxDefaults: data?.sandboxDefaults || { arrivals: 1000, diesel: 90, rain: 0, arrivalsMin: 100, arrivalsMax: 3000, baseForecast7d: 2000 },
    footerData:      data?.footerData      || fallback.footerData,
  };

  const rl = d.riskData?.level || 'LOW';
  const pct7 = d.kpiMetrics.forecast7Day?.changePct || 0;

  useEffect(() => {
    if (d.sandboxDefaults) {
      setSimParams({
        arrivals: d.sandboxDefaults.arrivals,
        diesel: d.sandboxDefaults.diesel,
        rain: d.sandboxDefaults.rain,
      });
      setSimResult(null);
      setSimError(null);
      setHasInitializedSim(true);
    }
  }, [d.sandboxDefaults, selectedCommodity]);

  const handleSimulate = async () => {
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await simulateForecast({
        commodity: selectedCommodity,
        arrivals: simParams.arrivals,
        diesel: simParams.diesel,
        rain: simParams.rain,
      });
      if (res.error) throw new Error(res.error);
      setSimResult(res);
    } catch (err) {
      setSimError(err.message || 'Simulation failed');
    } finally {
      setSimLoading(false);
    }
  };

  // Determine trend outlook
  const trendDirection = pct7 > 2 ? 'RISING' : pct7 < -2 ? 'FALLING' : 'STABLE';
  const trendConfig = {
    RISING:  { icon: <ArrowUpRight size={20} />, label: '📈 Prices Expected to Rise',  bg: 'bg-red-50 border-red-200', text: 'text-red-800', desc: `7-day forecast shows a ${Math.abs(pct7).toFixed(1)}% increase. Monitor closely for sustained upward trend.` },
    FALLING: { icon: <ArrowDownRight size={20} />, label: '📉 Prices Expected to Fall', bg: 'bg-green-50 border-green-200', text: 'text-green-800', desc: `7-day forecast shows a ${Math.abs(pct7).toFixed(1)}% decrease. Consider procurement opportunities.` },
    STABLE:  { icon: <Minus size={20} />, label: '➡️ Prices Expected to Remain Stable', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', desc: `7-day forecast shows minimal change (${Math.abs(pct7).toFixed(1)}%). Markets operating within normal bounds.` },
  };
  const trend = trendConfig[trendDirection];

  const combinedChart = [...(d.historicalData || []), ...(d.forecastData || [])];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">

      {/* ── HEADER ── */}
      <div id="overview" className="scroll-mt-24">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">National Price Intelligence & DSS</h1>
        <p className="text-sm font-semibold text-[#0A3A2A] mt-1">AI-Enabled Commodity Price Forecasting & Government Decision Support</p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">Government of India — Department of Consumer Affairs</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          1. PRICE TREND OUTLOOK (NEW — prominent banner)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={`${trend.bg} border-2 rounded-xl p-5 flex items-center gap-4`}>
        <div className={`${trend.text} flex-shrink-0`}>{trend.icon}</div>
        <div>
          <p className={`text-lg font-black ${trend.text}`}>{trend.label}</p>
          <p className="text-sm text-gray-700 font-medium mt-0.5">{trend.desc}</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. EXECUTIVE SUMMARY (KPI cards — no System Status)
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Current Price & Multi-Horizon Forecast">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Current Price */}
          <KpiCard label="Current Wholesale Price">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.currentPrice?.value)}</p>
            <p className="text-xs text-gray-400 mt-1 font-semibold">₹{d.kpiMetrics.currentPrice?.perKg} /kg · {d.kpiMetrics.currentPrice?.market}</p>
          </KpiCard>

          {/* 7-Day */}
          <KpiCard label="7-Day Forecast">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.forecast7Day?.value)}</p>
            <div className="mt-1">{pctBadge(d.kpiMetrics.forecast7Day?.changePct)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">by {d.kpiMetrics.forecast7Day?.date}</p>
          </KpiCard>

          {/* 14-Day */}
          <KpiCard label="14-Day Forecast">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.forecast14Day?.value)}</p>
            <div className="mt-1">{pctBadge(d.kpiMetrics.forecast14Day?.changePct)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">by {d.kpiMetrics.forecast14Day?.date}</p>
          </KpiCard>

          {/* 30-Day */}
          <KpiCard label="30-Day Forecast">
            <p className="text-4xl font-black text-gray-900 leading-none">{formatINR(d.kpiMetrics.forecast30Day?.value)}</p>
            <div className="mt-1">{pctBadge(d.kpiMetrics.forecast30Day?.changePct)}</div>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">by {d.kpiMetrics.forecast30Day?.date}</p>
          </KpiCard>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. PRICE TRAJECTORY CHART
      ══════════════════════════════════════════════════════════════════════ */}
      <Section id="price-intelligence" title="Price Trajectory & Forecast Visualization">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h3 className="font-bold text-gray-800">Wholesale Price — Historical Trend & AI Forecast</h3>
            <div className="flex gap-5 flex-wrap">
              <Legend color="#3b82f6" label="Actual Historical Price" />
              <Legend color="#ef4444" label="AI Forecast (Future)" dashed />
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
                {/* Future forecast — dashed red */}
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#ef4444" strokeWidth={3} strokeDasharray="6 3" dot={{ r: 5, fill: '#fff', stroke: '#ef4444', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#ef4444' }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Model Accuracy Strip (renamed from MAPE) */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
            <AccuracyCell label="7-Day Accuracy"  value={`${(100 - (d.modelErrors?.mape7 || 0)).toFixed(1)}%`} />
            <AccuracyCell label="14-Day Accuracy" value={`${(100 - (d.modelErrors?.mape14 || 0)).toFixed(1)}%`} />
            <AccuracyCell label="30-Day Accuracy" value={`${(100 - (d.modelErrors?.mape30 || 0)).toFixed(1)}%`} />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          4 & 5. RISK + WHAT'S DRIVING THIS FORECAST
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Risk & Early Warning */}
        <div id="risk-warning" className="scroll-mt-24">
          <SectionTitle title="Risk Assessment & Early Warning" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <div className={`p-5 rounded-xl mb-5 border ${riskBg[rl]}`}>
              <div className="flex items-center gap-4">
                {rl === 'LOW' || rl === 'MEDIUM'
                  ? <ShieldCheck size={40} className={rl === 'LOW' ? 'text-green-600' : 'text-yellow-600'} />
                  : <AlertTriangle size={40} className="text-red-600" />}
                <div>
                  <p className={`text-4xl font-black ${riskText[rl]} leading-none`}>{d.riskData?.score}</p>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${riskText[rl]}`}>
                    Score / 100 &nbsp;·&nbsp; {rl} RISK &nbsp;·&nbsp; Warning {d.riskData?.earlyWarning ? 'ACTIVE 🚨' : 'INACTIVE ✅'}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Score Explanation */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 flex items-start gap-2">
              <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                <strong>How is this calculated?</strong> {RISK_SCORE_EXPLANATION}
              </p>
            </div>

            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">What's Contributing to This Risk Level:</h4>
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

        {/* 5. What's Driving This Forecast (renamed from SHAP) */}
        <div id="forecast-explainability" className="scroll-mt-24">
          <SectionTitle title="What's Driving This Forecast?" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5 flex items-start gap-2">
              <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                <strong>Reading this chart:</strong> Each bar shows how much a specific factor pushed the AI forecast <strong>up (green)</strong> or <strong>down (red)</strong> from the baseline.
                Larger bars indicate stronger influence on the predicted price.
              </p>
            </div>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.shapDrivers} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} formatter={(v) => [`₹${v}`, 'Price Impact']} />
                  <Bar dataKey="value" barSize={22} radius={[0, 4, 4, 0]}>
                    {(d.shapDrivers || []).map((e, i) => (
                      <Cell key={`c-${i}`} fill={e.direction === 'increase' ? '#16a34a' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-3 text-xs font-bold">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-600"></div>Pushes Price Up</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500"></div>Pushes Price Down</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5.5 WHAT-IF MARKET SIMULATOR
      ══════════════════════════════════════════════════════════════════════ */}
      <Section title="Interactive What-If Market Simulator">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Settings2 size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
              <strong>Simulation Mode:</strong> Adjust market parameters below to dynamically simulate price impacts. 
              These are <em>hypothetical</em> scenarios using the active AI models and do not reflect observed reality.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Market Arrivals (Tonnes)</span>
                  <span className="font-bold text-gray-900">{simParams.arrivals}</span>
                </div>
                <input type="range" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min={d.sandboxDefaults?.arrivalsMin || 0} 
                  max={d.sandboxDefaults?.arrivalsMax || 10000} 
                  step="10"
                  value={simParams.arrivals} 
                  onChange={(e) => setSimParams({...simParams, arrivals: Number(e.target.value)})} 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Diesel Price (₹/Litre)</span>
                  <span className="font-bold text-gray-900">₹{simParams.diesel}</span>
                </div>
                <input type="range" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="50" max="150" step="1"
                  value={simParams.diesel} 
                  onChange={(e) => setSimParams({...simParams, diesel: Number(e.target.value)})} 
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Rainfall (mm)</span>
                  <span className="font-bold text-gray-900">{simParams.rain} mm</span>
                </div>
                <input type="range" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  min="0" max="200" step="1"
                  value={simParams.rain} 
                  onChange={(e) => setSimParams({...simParams, rain: Number(e.target.value)})} 
                />
              </div>
              <button 
                onClick={handleSimulate}
                disabled={simLoading || !hasInitializedSim}
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {simLoading ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>
            
            {/* Results */}
            <div className="border border-gray-100 bg-gray-50 rounded-xl p-5 flex flex-col justify-center">
              {simError ? (
                <p className="text-red-500 font-bold text-sm text-center">⚠️ {simError}</p>
              ) : simResult ? (
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Simulated 7-Day Forecast</p>
                  <p className="text-4xl font-black text-blue-700 mb-2">₹{simResult.simulatedForecast}</p>
                  <p className={`text-sm font-bold ${simResult.impactPct > 0 ? 'text-red-600' : 'text-green-600'} mb-4`}>
                    {simResult.impactPct > 0 ? '▲' : '▼'} {Math.abs(simResult.impactPct).toFixed(1)}% (₹{Math.abs(simResult.impact)}) from baseline
                  </p>
                  <div className="bg-white border border-gray-200 p-3 rounded text-left shadow-sm">
                    <p className="text-xs font-bold text-gray-700 mb-1">AI Suggestion:</p>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{simResult.suggestion}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Settings2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Adjust parameters and run simulation to see impacts.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. GOVERNMENT DECISION SUPPORT
      ══════════════════════════════════════════════════════════════════════ */}
      <Section id="decision-support" title="Government Decision Support">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Info size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-800 font-medium leading-relaxed">
              <strong>These recommendations are dynamically generated</strong> by the AI model based on current forecast, risk score, price trend, and market evidence — they are not static rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Assessment */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Cpu size={18} className="text-blue-600 flex-shrink-0" />
                <h4 className="font-bold text-gray-900">AI-Generated Assessment</h4>
              </div>
              <div className={`${riskBg[rl]} border rounded-xl p-4 mb-4`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${riskText[rl]}`}>Recommendation</p>
                <p className={`text-lg font-black ${riskText[rl]} mb-2`}>{d.decisionSupport?.recommendation}</p>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">{d.decisionSupport?.summary}</p>
              </div>

              {/* Decision Priority with explanation */}
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Decision Priority</h5>
                  <span className={`text-xs uppercase font-black px-2 py-1 rounded border ${riskBadge[d.kpiMetrics.decisionPriority || rl]}`}>
                    {d.kpiMetrics.decisionPriority || rl}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                  {PRIORITY_EXPLANATIONS[d.kpiMetrics.decisionPriority || rl]}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended Actions</h5>
                <ul className="space-y-1.5">
                  {(d.decisionSupport?.actions || []).map((a, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700 font-medium">
                      <span className="text-blue-500 mr-2 font-black">✦</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Verification Checklists */}
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

              {/* Explanation of what checkpoints mean */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Info size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  <strong>Before taking real-world action</strong>, a government analyst should verify each of these checkpoints to ensure the AI's recommendation is grounded in the latest on-ground reality.
                </p>
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
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. MODEL ACCURACY & FEATURE IMPORTANCE
      ══════════════════════════════════════════════════════════════════════ */}
      <Section id="model-accuracy" title="Model Performance & Accuracy">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 gap-8">
            {/* Left: Accuracy metrics */}
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-4">Forecast Accuracy by Horizon</h4>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <AccuracyCard label="7-Day" value={`${(100 - (d.modelErrors?.mape7 || 0)).toFixed(1)}%`} isActive={selectedHorizon === '7d'} onClick={() => setSelectedHorizon('7d')} />
                <AccuracyCard label="14-Day" value={`${(100 - (d.modelErrors?.mape14 || 0)).toFixed(1)}%`} isActive={selectedHorizon === '14d'} onClick={() => setSelectedHorizon('14d')} />
                <AccuracyCard label="30-Day" value={`${(100 - (d.modelErrors?.mape30 || 0)).toFixed(1)}%`} isActive={selectedHorizon === '30d'} onClick={() => setSelectedHorizon('30d')} />
              </div>

              <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-xs font-medium text-purple-900 leading-relaxed">
                <strong>{selectedHorizon === '7d' ? '7-Day' : selectedHorizon === '14d' ? '14-Day' : '30-Day'} Confidence: {d.modelErrors?.[`conf${selectedHorizon.replace('d','')}`]}</strong><br/>
                {d.modelErrors?.[`conf${selectedHorizon.replace('d','')}`]?.includes("LOW") ? 
                  "This long-horizon forecast should be treated as a directional signal rather than a precise price estimate because historical validation error is high." : 
                 d.modelErrors?.[`conf${selectedHorizon.replace('d','')}`]?.includes("MEDIUM") ? 
                  "This forecast has moderate historical error and should be interpreted with caution." : 
                  "While historical validation error is low, no forecast is guaranteed to be perfectly accurate."}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── DATA FOOTER ── */}
      <div className="pb-6 text-xs text-gray-400 flex gap-6 flex-wrap font-medium">
        <span>📡 Data Source: {d.footerData?.dataSource}</span>
        <span>📅 Last Update: {d.footerData?.lastUpdate}</span>
        <span>✅ Data Quality: {d.footerData?.dataQuality}%</span>
        <span>📊 Total Records: {d.footerData?.totalRecords?.toLocaleString()}</span>
      </div>
    </div>
  );
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const Section = ({ id, title, children }) => (
  <div id={id} className="scroll-mt-24">
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

const Legend = ({ color, label, dashed }) => (
  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
    <span style={{ backgroundColor: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : 'none', display: 'inline-block', width: 14, height: dashed ? 0 : 12, borderRadius: 2 }}></span>
    {label}
  </span>
);

const AccuracyCell = ({ label, value }) => (
  <div className="text-center">
    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</p>
    <p className="text-lg font-black text-gray-900">{value}</p>
  </div>
);

const AccuracyCard = ({ label, value, isActive, onClick }) => (
  <div onClick={onClick} className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${isActive ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>{label}</p>
    <p className={`text-xl font-black ${isActive ? 'text-purple-900' : 'text-gray-900'}`}>{value}</p>
  </div>
);

export default Dashboard;
