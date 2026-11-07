import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import RAGChatView from './components/RAGChatView';
import ComparisonView from './components/ComparisonView';
import AnomalyAuditView from './components/AnomalyAuditView';
import DocumentManagerView from './components/DocumentManagerView';
import FinancialCalculatorView from './components/FinancialCalculatorView';
import ApiKeyModal from './components/ApiKeyModal';
import {
  fetchOverview,
  fetchDocuments,
  fetchChatHistory,
  fetchComparisonData,
  fetchAnomalies,
  fetchCategoryBreakdown,
  fetchSystemStatus,
  queryRAG,
  clearChatHistory,
  uploadDocument,
  deleteDocument,
  loadSampleDocuments,
  generatePdfReport
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [overview, setOverview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [activeSeverity, setActiveSeverity] = useState('All');

  // UI interaction states
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isLoadingRag, setIsLoadingRag] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [statusRes, overRes, docsRes, histRes, compRes, catRes, anomRes] = await Promise.all([
        fetchSystemStatus().catch(() => null),
        fetchOverview().catch(() => null),
        fetchDocuments().catch(() => []),
        fetchChatHistory().catch(() => []),
        fetchComparisonData().catch(() => null),
        fetchCategoryBreakdown().catch(() => []),
        fetchAnomalies(activeSeverity).catch(() => [])
      ]);

      if (statusRes) setSystemStatus(statusRes);
      if (overRes) setOverview(overRes);
      if (docsRes) setDocuments(docsRes);
      if (histRes) setChatHistory(histRes);
      if (compRes) setComparisonData(compRes);
      if (catRes) setCategoryData(catRes);
      if (anomRes) setAnomalies(anomRes);
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter anomalies when severity changes
  const handleFilterSeverity = async (sev) => {
    setActiveSeverity(sev);
    try {
      const data = await fetchAnomalies(sev);
      setAnomalies(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Launch inquiry from prompt
  const handleSelectPrompt = (promptText) => {
    setInitialPrompt(promptText);
    setActiveTab('rag');
  };

  // Send RAG message
  const handleSendMessage = async (queryText, docId) => {
    setIsLoadingRag(true);
    try {
      const res = await queryRAG(queryText, 5, docId);
      // Append to local history
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          query: res.query,
          response: res.answer,
          citations: res.citations,
          timestamp: res.timestamp
        }
      ]);
      // Refresh system status
      fetchSystemStatus().then(setSystemStatus).catch(() => {});
    } catch (err) {
      showToast(err.message || 'Error processing query', 'error');
    } finally {
      setIsLoadingRag(false);
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    try {
      await clearChatHistory();
      setChatHistory([]);
      showToast('Chat history cleared', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Upload file
  const handleUploadFile = async (file) => {
    setIsUploading(true);
    try {
      const res = await uploadDocument(file);
      showToast(`Document "${res.original_name}" indexed successfully!`, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId) => {
    try {
      await deleteDocument(docId);
      showToast('Document deleted', 'info');
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Preload sample documents
  const handleLoadSamples = async () => {
    setIsLoadingSamples(true);
    try {
      const res = await loadSampleDocuments();
      showToast(`Loaded ${res.loaded_count || 4} sample financial filings & statements!`, 'success');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to load samples', 'error');
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Generate Executive PDF Report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await generatePdfReport();
      showToast('Report generated! Starting download...', 'success');
      window.open(res.download_url, '_blank');
    } catch (err) {
      showToast(err.message || 'Report generation failed', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl text-xs font-semibold flex items-center space-x-2 transition-all animate-bounce ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 border-rose-500 text-rose-200'
            : toastMessage.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
            : 'bg-indigo-950/90 border-indigo-500 text-indigo-200'
        }`}>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onGenerateReport={handleGenerateReport}
        onLoadSamples={handleLoadSamples}
        isGeneratingReport={isGeneratingReport}
        isLoadingSamples={isLoadingSamples}
      />

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardView
            overview={overview}
            categoryData={categoryData}
            documents={documents}
            onSelectPrompt={handleSelectPrompt}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'rag' && (
          <RAGChatView
            documents={documents}
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            isLoading={isLoadingRag}
            initialPrompt={initialPrompt}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonView
            comparisonData={comparisonData}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomalyAuditView
            anomalies={anomalies}
            onFilterSeverity={handleFilterSeverity}
            activeSeverity={activeSeverity}
          />
        )}

        {activeTab === 'calculator' && (
          <FinancialCalculatorView />
        )}

        {activeTab === 'documents' && (
          <DocumentManagerView
            documents={documents}
            onUploadFile={handleUploadFile}
            onDeleteDocument={handleDeleteDocument}
            isUploading={isUploading}
          />
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        systemStatus={systemStatus}
        onKeyConfigured={() => fetchSystemStatus().then(setSystemStatus)}
      />
    </div>
  );
}

