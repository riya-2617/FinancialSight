import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Calendar,
  Layers,
  Percent,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';

export default function ComparisonView({ comparisonData }) {
  const [selectedMetric, setSelectedMetric] = useState('Revenue');

  // Multi-period performance dataset for Recharts
  const periodTrends = [
    { period: 'Q3 2023', techCorpRev: 4247, techCorpMargin: 27.52, globalRetailRev: 2905, globalRetailMargin: 12.1 },
    { period: 'Q4 2023', techCorpRev: 4410, techCorpMargin: 28.10, globalRetailRev: 3120, globalRetailMargin: 12.8 },
    { period: 'Q1 2024', techCorpRev: 4520, techCorpMargin: 28.40, globalRetailRev: 3080, globalRetailMargin: 12.5 },
    { period: 'Q2 2024', techCorpRev: 4680, techCorpMargin: 28.90, globalRetailRev: 3200, globalRetailMargin: 13.0 },
    { period: 'Q3 2024', techCorpRev: 4850, techCorpMargin: 29.28, globalRetailRev: 3450, globalRetailMargin: 13.6 }
  ];

  const exportComparisonJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comparisonData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "FinancialSight_Company_Comparison.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Cross-Company & Multi-Period Performance Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare corporate scale, operating efficiency, margin expansion, and multi-year trajectories.
          </p>
        </div>
        <button
          onClick={exportComparisonJson}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export Metrics JSON</span>
        </button>
      </div>

      {/* Growth Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TechCorp YoY Top-Line Growth</span>
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-semibold">Q3 23 → Q3 24</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">+14.2%</span>
            <span className="text-xs text-slate-400">($4,247M → $4,850M)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud & AI Segment grew +25.1% YoY</span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TechCorp Operating Margin Expansion</span>
            <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-semibold">EBIT</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">+176 bps</span>
            <span className="text-xs text-slate-400">(27.52% → 29.28%)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Operating Income rose +21.5% to $1,420M</span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>GlobalRetail Annual Top-Line Growth</span>
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 font-semibold">FY23 → FY24</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">+10.58%</span>
            <span className="text-xs text-slate-400">($11,620M → $12,850M)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gross margin expanded +161 bps to 44.12%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Trajectory */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Quarterly Revenue Trajectory ($M)</h3>
              <p className="text-xs text-slate-400">Comparative revenue progression</p>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodTrends} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `$${val}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}M`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="techCorpRev" name="TechCorp Revenue ($M)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="globalRetailRev" name="GlobalRetail Revenue ($M)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Operating Margin Trajectory */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Operating Margin (%) Trajectory</h3>
              <p className="text-xs text-slate-400">Quarterly operational efficiency comparison</p>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={periodTrends} margin={{ top: 10, right: 15, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`${val}%`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="techCorpMargin" name="TechCorp Operating Margin" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="globalRetailMargin" name="GlobalRetail Operating Margin" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Side-by-Side Financial Comparison Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Extracted Financial Statement Line Items</h3>
            <p className="text-xs text-slate-400">Normalized comparisons directly verified from 10-Q & Annual Report footnotes</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Financial Metric</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-indigo-400">TechCorp Global (Q3 2024)</th>
                <th className="py-3 px-4 text-emerald-400">GlobalRetail Brands (FY 2024)</th>
                <th className="py-3 px-4">Variance / Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Total Consolidated Revenue</td>
                <td className="py-3 px-4 text-slate-400">USD Millions</td>
                <td className="py-3 px-4 font-medium text-white">$ 4,850.0</td>
                <td className="py-3 px-4 font-medium text-white">$ 12,850.0</td>
                <td className="py-3 px-4 text-emerald-400 font-medium">+14.2% YoY vs +10.58% YoY</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Gross Profit</td>
                <td className="py-3 px-4 text-slate-400">USD Millions</td>
                <td className="py-3 px-4 font-medium text-white">$ 3,318.0</td>
                <td className="py-3 px-4 font-medium text-white">$ 5,670.0</td>
                <td className="py-3 px-4 text-slate-300">Software scale vs retail distribution</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Gross Margin</td>
                <td className="py-3 px-4 text-slate-400">%</td>
                <td className="py-3 px-4 font-medium text-indigo-300">68.42 %</td>
                <td className="py-3 px-4 font-medium text-emerald-300">44.12 %</td>
                <td className="py-3 px-4 text-slate-300">+2,430 bps tech software premium</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Operating Income (EBIT)</td>
                <td className="py-3 px-4 text-slate-400">USD Millions</td>
                <td className="py-3 px-4 font-medium text-white">$ 1,420.0</td>
                <td className="py-3 px-4 font-medium text-white">$ 1,750.0</td>
                <td className="py-3 px-4 text-emerald-400 font-medium">+21.5% YoY EBIT acceleration</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Operating Margin</td>
                <td className="py-3 px-4 text-slate-400">%</td>
                <td className="py-3 px-4 font-medium text-indigo-300">29.28 %</td>
                <td className="py-3 px-4 font-medium text-emerald-300">13.62 %</td>
                <td className="py-3 px-4 text-emerald-400">+176 bps YoY expansion</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Net Income After Tax</td>
                <td className="py-3 px-4 text-slate-400">USD Millions</td>
                <td className="py-3 px-4 font-medium text-white">$ 1,193.0</td>
                <td className="py-3 px-4 font-medium text-white">$ 1,025.0</td>
                <td className="py-3 px-4 text-emerald-400 font-medium">+22.7% YoY Net Margin</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Current Ratio (Liquidity)</td>
                <td className="py-3 px-4 text-slate-400">Ratio (x)</td>
                <td className="py-3 px-4 font-medium text-indigo-300">3.44x</td>
                <td className="py-3 px-4 font-medium text-slate-400">1.82x</td>
                <td className="py-3 px-4 text-emerald-400 font-medium">Extraordinary short-term coverage</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-semibold text-slate-200">Free Cash Flow (FCF)</td>
                <td className="py-3 px-4 text-slate-400">USD Millions</td>
                <td className="py-3 px-4 font-medium text-white">$ 3,370.0</td>
                <td className="py-3 px-4 font-medium text-white">$ 1,210.0</td>
                <td className="py-3 px-4 text-emerald-400 font-medium">Strong organic capital generation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

