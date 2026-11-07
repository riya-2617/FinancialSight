import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Percent,
  DollarSign,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function FinancialCalculatorView() {
  const [activeModel, setActiveModel] = useState('dcf');

  // DCF Model States (Initialized with TechCorp's extracted numbers: FCF $3,370M)
  const [initialFcf, setInitialFcf] = useState(3370);
  const [growthRate, setGrowthRate] = useState(12);
  const [terminalGrowth, setTerminalGrowth] = useState(3.0);
  const [discountRate, setDiscountRate] = useState(9.5);

  // DuPont Model States (Initialized with extracted balance sheet & income statement metrics)
  const [netIncome, setNetIncome] = useState(1193);
  const [revenue, setRevenue] = useState(4850);
  const [totalAssets, setTotalAssets] = useState(59880);
  const [stockholdersEquity, setStockholdersEquity] = useState(34010);

  // Margin Sensitivity States
  const [baseRevenue, setBaseRevenue] = useState(4850);
  const [revGrowthPct, setRevGrowthPct] = useState(14.2);
  const [cogsMarginPct, setCogsMarginPct] = useState(31.58);
  const [opexGrowthPct, setOpexGrowthPct] = useState(14.3);
  const [baseOpex, setBaseOpex] = useState(1898);

  // DCF Calculations
  const projectedYears = [1, 2, 3, 4, 5];
  const dcfProjections = projectedYears.map((year) => {
    const fcf = initialFcf * Math.pow(1 + growthRate / 100, year);
    const pv = fcf / Math.pow(1 + discountRate / 100, year);
    return {
      year: `Year ${year}`,
      fcf: Math.round(fcf),
      pv: Math.round(pv),
    };
  });

  const sumPvFcf = dcfProjections.reduce((acc, curr) => acc + curr.pv, 0);
  const year5Fcf = dcfProjections[4].fcf;
  const terminalValue = (year5Fcf * (1 + terminalGrowth / 100)) / ((discountRate - terminalGrowth) / 100);
  const pvTerminalValue = terminalValue / Math.pow(1 + discountRate / 100, 5);
  const enterpriseValue = sumPvFcf + pvTerminalValue;

  // DuPont Calculations
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
  const assetTurnover = totalAssets > 0 ? revenue / totalAssets : 0;
  const equityMultiplier = stockholdersEquity > 0 ? totalAssets / stockholdersEquity : 0;
  const roe = (netMargin / 100) * assetTurnover * equityMultiplier * 100;

  // Margin Sensitivity Calculations
  const projectedRev = baseRevenue * (1 + revGrowthPct / 100);
  const projectedCogs = projectedRev * (cogsMarginPct / 100);
  const projectedGrossProfit = projectedRev - projectedCogs;
  const projectedGrossMargin = (projectedGrossProfit / projectedRev) * 100;
  const projectedOpex = baseOpex * (1 + opexGrowthPct / 100);
  const projectedOperatingIncome = projectedGrossProfit - projectedOpex;
  const projectedOperatingMargin = (projectedOperatingIncome / projectedRev) * 100;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <span>Interactive Financial Modeling & What-If Simulation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate discounted cash flows, DuPont Return on Equity (ROE), and operating margin sensitivities.
          </p>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 'dcf', label: 'DCF Valuation' },
            { id: 'dupont', label: 'DuPont ROE Analysis' },
            { id: 'sensitivity', label: 'Margin Sensitivity' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModel(m.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeModel === m.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model 1: DCF Valuation */}
      {activeModel === 'dcf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>DCF Model Assumptions</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                Auto-seeded from Q3 10-Q
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Base Free Cash Flow (FCF)</span>
                  <span className="font-bold text-indigo-400">${initialFcf.toLocaleString()}M</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="50"
                  value={initialFcf}
                  onChange={(e) => setInitialFcf(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>5-Year Annual FCF Growth Rate</span>
                  <span className="font-bold text-emerald-400">{growthRate}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="35"
                  step="0.5"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Discount Rate / WACC</span>
                  <span className="font-bold text-amber-400">{discountRate}%</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="16"
                  step="0.25"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Perpetual Terminal Growth Rate</span>
                  <span className="font-bold text-indigo-400">{terminalGrowth}%</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="5.0"
                  step="0.1"
                  value={terminalGrowth}
                  onChange={(e) => setTerminalGrowth(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
              <div className="font-semibold text-slate-200">Valuation Methodology:</div>
              <p className="text-slate-400 leading-relaxed">
                Enterprise Value calculated via 2-stage Gordon Growth Model with midpoint discounted present value.
              </p>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Valuation KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                <span className="text-[10px] font-semibold text-indigo-300 uppercase">Implied Enterprise Value</span>
                <div className="text-2xl font-black text-white mt-1">
                  ${Math.round(enterpriseValue).toLocaleString()}M
                </div>
                <span className="text-[10px] text-slate-400">Total Firm DCF Value</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">PV of 5-Yr Cash Flows</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  ${Math.round(sumPvFcf).toLocaleString()}M
                </div>
                <span className="text-[10px] text-slate-400">{((sumPvFcf / enterpriseValue) * 100).toFixed(1)}% of Enterprise Val</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Present Value Terminal</span>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  ${Math.round(pvTerminalValue).toLocaleString()}M
                </div>
                <span className="text-[10px] text-slate-400">{((pvTerminalValue / enterpriseValue) * 100).toFixed(1)}% of Enterprise Val</span>
              </div>
            </div>

            {/* Projection Chart */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
              <h4 className="text-xs font-semibold text-white mb-3">Projected Annual Free Cash Flow ($M)</h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dcfProjections} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val) => [`$${Number(val).toLocaleString()}M`, '']}
                    />
                    <Bar dataKey="fcf" name="Nominal FCF" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pv" name="Discounted PV" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model 2: DuPont ROE Analysis */}
      {activeModel === 'dupont' && (
        <div className="space-y-6">
          {/* ROE Hero Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                DuPont 3-Way Return on Equity (ROE) Decomposition
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                ROE = <span className="text-emerald-400">{roe.toFixed(2)}%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Decomposes Return on Equity into operational profitability (Net Margin), asset efficiency (Asset Turnover), and capital structure leverage.
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-right">
              <span className="text-slate-400">Quarterly Net Income:</span>
              <div className="font-bold text-white text-base">${netIncome.toLocaleString()}M</div>
            </div>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Net Margin */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">1. Profitability</span>
                <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-bold text-xs">%</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Net Profit Margin</span>
                <div className="text-2xl font-bold text-indigo-400 mt-0.5">{netMargin.toFixed(2)}%</div>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                ${netIncome}M Net Income / ${revenue}M Rev
              </div>
            </div>

            {/* Pillar 2: Asset Turnover */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">2. Efficiency</span>
                <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs">Turnover</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Asset Turnover Ratio</span>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5">{assetTurnover.toFixed(3)}x</div>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                ${revenue}M Rev / ${totalAssets}M Assets
              </div>
            </div>

            {/* Pillar 3: Financial Leverage */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">3. Leverage</span>
                <span className="p-1 rounded bg-amber-500/10 text-amber-400 font-bold text-xs">Multiplier</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs">Equity Multiplier</span>
                <div className="text-2xl font-bold text-amber-400 mt-0.5">{equityMultiplier.toFixed(2)}x</div>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                ${totalAssets}M Assets / ${stockholdersEquity}M Equity
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model 3: Margin Sensitivity */}
      {activeModel === 'sensitivity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Sensitivity Variables</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Top-Line Revenue Growth</span>
                  <span className="font-bold text-emerald-400">+{revGrowthPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="0.5"
                  value={revGrowthPct}
                  onChange={(e) => setRevGrowthPct(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>COGS as % of Revenue</span>
                  <span className="font-bold text-rose-400">{cogsMarginPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  step="0.25"
                  value={cogsMarginPct}
                  onChange={(e) => setCogsMarginPct(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Operating Expenses Growth</span>
                  <span className="font-bold text-amber-400">+{opexGrowthPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={opexGrowthPct}
                  onChange={(e) => setOpexGrowthPct(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Simulated Gross Margin</span>
                <div className="text-2xl font-bold text-indigo-400 mt-1">
                  {projectedGrossMargin.toFixed(2)}%
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gross Profit: ${Math.round(projectedGrossProfit).toLocaleString()}M
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Simulated Operating Margin</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {projectedOperatingMargin.toFixed(2)}%
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Operating Income: ${Math.round(projectedOperatingIncome).toLocaleString()}M
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-white">Scenario Summary:</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Under a +{revGrowthPct}% revenue expansion with disciplined OpEx growth capped at +{opexGrowthPct}%, operating profit reaches <b>${Math.round(projectedOperatingIncome).toLocaleString()}M</b> with an operating margin of <b>{projectedOperatingMargin.toFixed(2)}%</b>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

