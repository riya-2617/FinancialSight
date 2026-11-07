import React from 'react';
import {
  TrendingUp,
  FileText,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  Download,
  Key,
  FolderOpen,
  Sparkles,
  RefreshCw,
  Layers,
  Calculator
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  systemStatus,
  onOpenApiKeyModal,
  onGenerateReport,
  onLoadSamples,
  isGeneratingReport,
  isLoadingSamples
}) {
  const tabs = [
    { id: 'overview', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'rag', label: 'Multimodal RAG Assistant', icon: MessageSquare },
    { id: 'comparison', label: 'Financial Comparison', icon: TrendingUp },
    { id: 'anomalies', label: 'Anomaly & Fraud Audit', icon: AlertTriangle },
    { id: 'calculator', label: 'Financial Modeling & What-If', icon: Calculator },
    { id: 'documents', label: 'Document & OCR Hub', icon: FolderOpen },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Financial<span className="text-indigo-400">Sight</span></span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Multimodal RAG
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI-Powered Multimodal Financial Intelligence & Anomaly Audit
              </p>
            </div>
          </div>

          {/* Quick System Status & Actions */}
          <div className="flex items-center space-x-2.5">
            {/* System Status Pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${systemStatus?.gemini_api_configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="text-slate-300">
                  {systemStatus?.gemini_api_configured ? 'Gemini 2.5 Flash' : 'Hybrid Offline Engine'}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1 text-slate-400">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{systemStatus?.total_indexed_chunks || 0} Chunks</span>
              </div>
            </div>

            {/* Load Samples button */}
            <button
              onClick={onLoadSamples}
              disabled={isLoadingSamples}
              title="Preload realistic Form 10-Q, Annual Report & Bank Statement samples"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoadingSamples ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Load Samples</span>
            </button>

            {/* API Key Configure button */}
            <button
              onClick={onOpenApiKeyModal}
              title="Configure Gemini API Key"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">API Key</span>
            </button>

            {/* Executive PDF Report Generate */}
            <button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/25 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingReport ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingReport ? 'Exporting PDF...' : 'Executive PDF'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

