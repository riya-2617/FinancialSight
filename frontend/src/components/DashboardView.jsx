import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  ShieldAlert,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';

export default function DashboardView({
  overview,
  categoryData,
  documents,
  onSelectPrompt,
  onNavigateTab
}) {
  const suggestedPrompts = [
    {
      title: "TechCorp Q3 2024 Operating Margin",
      query: "What was TechCorp's operating margin and cloud revenue in Q3 2024, and how does it compare to prior guidance?",
      tag: "10-Q Filing"
    },
    {
      title: "Suspicious Disbursement Audit",
      query: "Are there any duplicate payments or unauthorized weekend transactions in our October statement?",
      tag: "Fraud Audit"
    },
    {
      title: "GlobalRetail Multi-Year Comparison",
      query: "Compare GlobalRetail's revenue, gross margin, and operating cash flows between FY2023 and FY2024.",
      tag: "Cross-Year Analysis"
    },
    {
      title: "Liquidity & Solvency Ratios",
      query: "What is TechCorp's Current Ratio, Debt-to-Equity ratio, and Free Cash Flow as of September 30, 2024?",
      tag: "Balance Sheet"
    }
  ];

  // Performance sample data for TechCorp & GlobalRetail
  const comparisonChartData = [
    { name: 'TechCorp Q3 23', revenue: 4247, opIncome: 1169, margin: 27.5 },
    { name: 'TechCorp Q3 24', revenue: 4850, opIncome: 1420, margin: 29.3 },
    { name: 'GlobalRetail FY23', revenue: 11620, opIncome: 1430, margin: 12.3 },
    { name: 'GlobalRetail FY24', revenue: 12850, opIncome: 1750, margin: 13.6 },
  ];

  const colorsList = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-slate-950 border border-indigo-500/20 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multimodal Financial Grounding Active</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Financial Intelligence & Multimodal RAG Workstation
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Extract tabular metrics, verify layout evidence with OCR, detect transaction anomalies, and query corporate filings with mathematically grounded citations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('rag')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Financial Assistant</span>
            </button>
            <button
              onClick={() => onNavigateTab('anomalies')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Audit Anomalies ({overview?.anomalies_detected || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Indexed Documents</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {overview?.documents_count || 0}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs text-slate-400">
              <span className="text-indigo-400 font-medium">{overview?.indexed_chunks || 0}</span>
              <span>multimodal chunks stored</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Verified Financial Metrics</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              {overview?.financial_metrics_extracted || 0}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Balance Sheet & Income Statement KPIs</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Detected Anomalies</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 tracking-tight">
              {overview?.anomalies_detected || 0}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs text-rose-300">
              <span>Z-score outliers, duplicates & weekend spikes</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tracked Net Position</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              ${(overview?.net_cash_flow ? (overview.net_cash_flow / 1000).toFixed(1) : '0')}k
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <span className="text-emerald-400">+${(overview?.total_inflows ? (overview.total_inflows / 1000).toFixed(0) : '0')}k in</span>
              <span>•</span>
              <span className="text-rose-400">-${(overview?.total_outflows ? (overview.total_outflows / 1000).toFixed(0) : '0')}k out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested RAG Queries Launchpad */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Suggested Analytical Inquiries</h3>
          </div>
          <span className="text-xs text-slate-400">Click any card to launch RAG reasoning</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(p.query)}
              className="text-left p-3.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
                  {p.tag}
                </span>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {p.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  "{p.query}"
                </p>
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-medium text-indigo-400 mt-3 pt-2 border-t border-slate-700/40">
                <span>Run Analysis</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Corporate Expense Category Distribution */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Statement Spending by Category</h3>
              <p className="text-xs text-slate-400">Breakdown of October disbursements from bank ledger</p>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 w-full">
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 7)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke="#64748b"
                    fontSize={10}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Total Spent']}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {categoryData.slice(0, 7).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorsList[index % colorsList.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No transaction category data available.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Revenue vs Operating Income Multi-Period */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Cross-Entity Financial Scale ($ Millions)</h3>
              <p className="text-xs text-slate-400">Revenue vs Operating Income extracted from filings</p>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -15, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `$${val}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}M`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Total Revenue ($M)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opIncome" name="Operating Income ($M)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ingested Documents Snapshot */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Ingested Financial Documentation</h3>
            <p className="text-xs text-slate-400">Real-time status of loaded 10-Q reports, statements, and invoices</p>
          </div>
          <button
            onClick={() => onNavigateTab('documents')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
          >
            <span>Manage All Documents</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-slate-800/80">
          {documents && documents.length > 0 ? (
            documents.slice(0, 4).map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-200">{doc.original_name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {doc.file_type.toUpperCase()} • {doc.total_pages} page(s) • {doc.extracted_tables_count} table(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {doc.anomaly_count > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {doc.anomaly_count} Anomalies
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Processed
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              No documents ingested yet. Click "Load Samples" in the top bar to initialize.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

