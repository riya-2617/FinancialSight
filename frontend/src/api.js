const API_BASE = '/api';

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function configureApiKey(apiKey) {
  const res = await fetch(`${API_BASE}/system/configure-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) throw new Error('Failed to configure API key');
  return res.json();
}

export async function fetchOverview() {
  const res = await fetch(`${API_BASE}/analytics/overview`);
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchDocumentDetails(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`);
  if (!res.ok) throw new Error('Failed to fetch document details');
  return res.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

export async function loadSampleDocuments() {
  const res = await fetch(`${API_BASE}/documents/load-samples`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to load sample documents');
  return res.json();
}

export async function queryRAG(query, topK = 5, documentId = null) {
  const res = await fetch(`${API_BASE}/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK, document_id: documentId }),
  });
  if (!res.ok) throw new Error('Failed to query RAG assistant');
  return res.json();
}

export async function fetchChatHistory() {
  const res = await fetch(`${API_BASE}/rag/history`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return res.json();
}

export async function clearChatHistory() {
  const res = await fetch(`${API_BASE}/rag/clear-history`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear chat history');
  return res.json();
}

export async function fetchComparisonData() {
  const res = await fetch(`${API_BASE}/analytics/compare`);
  if (!res.ok) throw new Error('Failed to fetch comparison data');
  return res.json();
}

export async function fetchAnomalies(severity = 'All') {
  const url = severity === 'All' ? `${API_BASE}/analytics/anomalies` : `${API_BASE}/analytics/anomalies?severity=${severity}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch anomalies');
  return res.json();
}

export async function fetchCategoryBreakdown() {
  const res = await fetch(`${API_BASE}/analytics/category-breakdown`);
  if (!res.ok) throw new Error('Failed to fetch category breakdown');
  return res.json();
}

export async function generatePdfReport() {
  const res = await fetch(`${API_BASE}/reports/generate-pdf`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate PDF report');
  return res.json();
}

