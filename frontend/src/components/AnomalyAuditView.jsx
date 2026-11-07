import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Download,
  Filter,
  CheckCircle,
  Copy,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function AnomalyAuditView({ anomalies, onFilterSeverity, activeSeverity }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const highSeverityCount = anomalies.filter(a => a.anomaly_severity === 'High').length;
  const mediumSeverityCount = anomalies.filter(a => a.anomaly_severity === 'Medium').length;
  const lowSeverityCount = anomalies.filter(a => a.anomaly_severity === 'Low').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Transaction Anomaly & Expense Fraud Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Statistical Z-score fences, duplicate invoice detection, and unauthorized off-hours disbursements.
          </p>
        </div>
        <a
          href="/api/reports/export-anomalies-csv"
          download
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-rose-400" />
          <span>Export Anomalies CSV</span>
        </a>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onFilterSeverity('High')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeSeverity === 'High'
              ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50'
              : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">High Risk Critical</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{highSeverityCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Duplicate wire payouts & round-dollar unverified transfers
          </p>
        </button>

        <button
          onClick={() => onFilterSeverity('Medium')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeSeverity === 'Medium'
              ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/50'
              : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Medium Risk Warning</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{mediumSeverityCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Z-score standard deviation & IQR fence deviations
          </p>
        </button>

        <button
          onClick={() => onFilterSeverity('All')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeSeverity === 'All'
              ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
              : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">All Flagged Records</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{anomalies.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total ledger items flagged for audit reconciliation
          </p>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Severity:</span>
          </span>
          {['All', 'High', 'Medium'].map((s) => (
            <button
              key={s}
              onClick={() => onFilterSeverity(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeSeverity === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          Showing {anomalies.length} detected anomaly record(s)
        </span>
      </div>

      {/* Anomalies Table / Card Stream */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Merchant / Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Disbursement Amount</th>
                <th className="py-3 px-4">Risk Severity</th>
                <th className="py-3 px-4">Audit Reason & Heuristic Grounding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {anomalies.length > 0 ? (
                anomalies.map((a, idx) => {
                  const isHigh = a.anomaly_severity === 'High';
                  const isMed = a.anomaly_severity === 'Medium';
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {a.transaction_date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {a.description}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                          {a.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-rose-400">
                        ${Math.abs(a.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isHigh
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : isMed
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {a.anomaly_severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-relaxed max-w-md">
                        <div className="flex items-start space-x-1.5">
                          <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isHigh ? 'text-rose-400' : 'text-amber-400'}`} />
                          <span>{a.anomaly_reason}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-xs text-slate-500">
                    No anomalies found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

