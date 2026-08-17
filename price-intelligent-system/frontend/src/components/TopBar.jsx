import React, { useRef } from 'react';
import { Calendar, ChevronDown, Download, MapPin, Bell } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMMODITIES = [
  { key: 'onion',  label: 'Onion',    emoji: '🧅', market: 'Lasalgaon',  state: 'Maharashtra', marketType: 'APMC Wholesale' },
  { key: 'potato', label: 'Potato',   emoji: '🥔', market: 'Achalda',    state: 'Uttar Pradesh', marketType: 'APMC Wholesale' },
  { key: 'turdal', label: 'Tur Dal',  emoji: '🫘', market: 'Latur',      state: 'Maharashtra',   marketType: 'APMC Wholesale' },
];
const FORECAST_HORIZONS = ['7 Days (Short-term)', '14 Days (Medium-term)', '30 Days (Long-term)'];

const TopBar = ({ selectedCommodity = 'onion', onCommodityChange, dashboardData }) => {
  const activeCommodity = COMMODITIES.find(c => c.key === selectedCommodity) || COMMODITIES[0];
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleDownloadReport = () => {
    const d = dashboardData || {};
    const kpi = d.kpiMetrics || {};
    const risk = d.riskData || {};
    const dss = d.decisionSupport || {};
    const errors = d.modelErrors || {};

    const currentPrice = kpi.currentPrice?.value || 'N/A';
    const p7 = kpi.forecast7Day?.value || 'N/A';
    const p14 = kpi.forecast14Day?.value || 'N/A';
    const p30 = kpi.forecast30Day?.value || 'N/A';
    const pct7 = kpi.forecast7Day?.changePct;
    const pct14 = kpi.forecast14Day?.changePct;
    const pct30 = kpi.forecast30Day?.changePct;

    const trendDir = pct7 > 2 ? 'RISING' : pct7 < -2 ? 'FALLING' : 'STABLE';

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Helper to add centered text
    const addCenteredText = (text, y, size = 12, isBold = false) => {
      doc.setFontSize(size);
      if (isBold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
      doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Header
    doc.setFillColor(30, 58, 138); // Deep blue
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    addCenteredText("KRISHI DRISHTI", 12, 16, true);
    addCenteredText("PRICE INTELLIGENCE & DECISION SUPPORT REPORT", 19, 10, false);

    let y = 35;
    doc.setTextColor(0, 0, 0);

    // Metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Commodity:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${activeCommodity.label}`, 45, y);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Market:`, 14, y+6);
    doc.setFont("helvetica", "normal");
    doc.text(`${activeCommodity.market} APMC (${activeCommodity.state})`, 45, y+6);

    doc.setFont("helvetica", "bold");
    doc.text(`Generated:`, 120, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${new Date().toLocaleString('en-IN')}`, 145, y);
    
    y += 18;

    // 1. Current Price & Forecast
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("1. CURRENT PRICE & FORECAST", 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value', 'Change / Status']],
      body: [
        ['Current Wholesale Price', `Rs ${currentPrice} / quintal`, ''],
        ['Price Trend Outlook', trendDir, ''],
        ['7-Day Forecast', `Rs ${p7}`, `${pct7 > 0 ? '+' : ''}${pct7?.toFixed(2)}%`],
        ['14-Day Forecast', `Rs ${p14}`, `${pct14 > 0 ? '+' : ''}${pct14?.toFixed(2)}%`],
        ['30-Day Forecast', `Rs ${p30}`, `${pct30 > 0 ? '+' : ''}${pct30?.toFixed(2)}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    y = doc.lastAutoTable.finalY + 12;

    // 2. Risk Assessment
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("2. RISK ASSESSMENT", 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const riskDesc = doc.splitTextToSize("Risk Score is a composite indicator based on forecast price pressure, historical volatility, and market arrival/supply pressure.", pageWidth - 28);
    doc.text(riskDesc, 14, y);
    y += (riskDesc.length * 5) + 2;

    autoTable(doc, {
      startY: y,
      head: [['Risk Score', 'Risk Level', 'Early Warning']],
      body: [[
        `${risk.score || 'N/A'} / 100`, 
        risk.level || 'N/A', 
        risk.earlyWarning ? 'ACTIVE' : 'INACTIVE'
      ]],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Risk Drivers:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    (risk.drivers || []).forEach(driver => {
      doc.text(`- ${driver}`, 18, y);
      y += 5;
    });
    y += 5;

    // 3. Government Decision Support
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("3. GOVERNMENT DECISION SUPPORT", 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const prioDesc = doc.splitTextToSize("Priority indicates the urgency level assigned by the decision-support engine based on forecast pressure and market risk.", pageWidth - 28);
    doc.text(prioDesc, 14, y);
    y += (prioDesc.length * 5) + 1;

    const confDesc = doc.splitTextToSize("Confidence is based on the selected forecast horizon's historical validation performance.", pageWidth - 28);
    doc.text(confDesc, 14, y);
    y += (confDesc.length * 5) + 2;

    autoTable(doc, {
      startY: y,
      head: [['Recommendation', 'Priority', 'Confidence']],
      body: [[
        dss.recommendation || 'N/A', 
        dss.priority || 'N/A', 
        dss.confidence || 'N/A'
      ]],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    y = doc.lastAutoTable.finalY + 6;
    
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary:", 14, y);
    doc.setFont("helvetica", "normal");
    const splitSummary = doc.splitTextToSize(dss.summary || 'N/A', pageWidth - 28);
    doc.text(splitSummary, 14, y + 5);
    y += (splitSummary.length * 5) + 6;

    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFont("helvetica", "bold");
    doc.text("Recommended Actions:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    (dss.actions || []).forEach(action => {
      const splitAction = doc.splitTextToSize(`+ ${action}`, pageWidth - 32);
      doc.text(splitAction, 18, y);
      y += (splitAction.length * 5);
    });
    y += 3;

    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFont("helvetica", "bold");
    doc.text("Verification Checkpoints (verify before real-world action):", 14, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    (dss.checklists || []).forEach(check => {
      const splitCheck = doc.splitTextToSize(`[ ] ${check}`, pageWidth - 32);
      doc.text(splitCheck, 18, y);
      y += (splitCheck.length * 5);
    });
    y += 7;
    
    if (y > 230) { doc.addPage(); y = 20; }

    // 4. Model Performance & Drivers
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("4. MODEL PERFORMANCE & DRIVERS", 14, y);
    doc.setTextColor(0, 0, 0);
    y += 6;

    const mape7 = errors.mape7 ? (100 - errors.mape7).toFixed(1) + '%' : 'N/A';
    const mape14 = errors.mape14 ? (100 - errors.mape14).toFixed(1) + '%' : 'N/A';
    const mape30 = errors.mape30 ? (100 - errors.mape30).toFixed(1) + '%' : 'N/A';

    autoTable(doc, {
      startY: y,
      head: [['7-Day Accuracy', '14-Day Accuracy', '30-Day Accuracy']],
      body: [[mape7, mape14, mape30]],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    y = doc.lastAutoTable.finalY + 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Key Factors Influencing This Forecast:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    (d.shapDrivers || []).forEach(s => {
      const dirText = s.direction === 'increase' ? 'increases predicted price' : 'decreases predicted price';
      doc.text(`- ${s.name}: Rs ${s.value} (${dirText})`, 18, y);
      y += 5;
    });

    y += 2;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    const shapDisclaimer = doc.splitTextToSize("Model contributions describe how features influenced the prediction; they do not establish physical causation.", pageWidth - 28);
    doc.text(shapDisclaimer, 14, y);
    doc.setTextColor(0, 0, 0);

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Data Source: AGMARKNET & OpenMeteo | Model: XGBoost Multi-Horizon`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Disclaimer: Advisory only. Not an autonomous action mandate.`, 14, doc.internal.pageSize.height - 6);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, doc.internal.pageSize.height - 10);
    }

    doc.save(`KrishiDrishti_Report_${activeCommodity.label}_${today.replace(/ /g, '_')}.pdf`);
  };

  return (
    <div className="bg-white px-6 py-3.5 flex items-center justify-between shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="flex items-center gap-5 flex-wrap">

        {/* Commodity Selector */}
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

        {/* Region & APMC Market */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
          <MapPin size={14} className="text-emerald-600 flex-shrink-0" />
          <div className="text-sm font-semibold text-emerald-800">
            {activeCommodity.market} APMC
            <span className="text-xs text-emerald-600 ml-1.5">· {activeCommodity.state}</span>
          </div>
        </div>

        {/* Market Type */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Market Type</span>
          <div className="border border-gray-200 rounded-md px-3 py-1.5 text-sm font-semibold bg-gray-50 text-gray-700">
            {activeCommodity.marketType}
          </div>
        </div>

      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-4">
        <div className="border border-gray-200 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm font-medium bg-white text-gray-600">
          <Calendar size={13} className="text-gray-400" />
          {today}
        </div>



        <button 
          onClick={handleDownloadReport}
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Download size={15} />
          Download Report
        </button>
      </div>
    </div>
  );
};

export default TopBar;
