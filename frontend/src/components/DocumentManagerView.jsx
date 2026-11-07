import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Layers,
  Table as TableIcon,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { fetchDocumentDetails } from '../api';

export default function DocumentManagerView({
  documents,
  onUploadFile,
  onDeleteDocument,
  isUploading
}) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetails, setDocDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  const handleViewDetails = async (doc) => {
    setSelectedDoc(doc);
    setLoadingDetails(true);
    try {
      const details = await fetchDocumentDetails(doc.id);
      setDocDetails(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'pdf') return <FileText className="w-5 h-5 text-indigo-400" />;
    if (fileType === 'csv' || fileType === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    return <ImageIcon className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-indigo-400" />
          <span>Multimodal Document Ingestion & OCR Hub</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Upload financial 10-K/10-Q reports, invoices, bank statement spreadsheets, or scanned receipt images.
        </p>
      </div>

      {/* Drag & Drop Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
          className="hidden"
          disabled={isUploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            ) : (
              <UploadCloud className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isUploading ? 'Extracting text, tables, and OCR...' : 'Click to upload or drag & drop files here'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports Form 10-K/10-Q PDFs, Bank Statements (CSV/XLSX), Scanned Invoices, Receipts (PNG/JPG)
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all">
            Browse Files
          </span>
        </label>
      </div>

      {/* Documents Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Ingestion List */}
        <div className={selectedDoc ? 'lg:col-span-6 space-y-3' : 'lg:col-span-12 space-y-3'}>
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">Ingested Documents ({documents.length})</span>
            <span>Click any file to inspect extracted chunks & OCR</span>
          </div>

          <div className="space-y-2.5">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => handleViewDetails(doc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 group-hover:scale-105 transition-transform flex-shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate max-w-[280px]">
                        {doc.original_name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="uppercase font-medium text-indigo-400">{doc.file_type}</span>
                        <span>•</span>
                        <span>{doc.total_pages} page(s)</span>
                        <span>•</span>
                        <span>{doc.extracted_tables_count} table(s)</span>
                        {doc.anomaly_count > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-rose-400 font-semibold">{doc.anomaly_count} Anomalies</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(doc);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                      title="Inspect Chunks"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete document "${doc.original_name}"?`)) {
                          onDeleteDocument(doc.id);
                          if (selectedDoc?.id === doc.id) {
                            setSelectedDoc(null);
                            setDocDetails(null);
                          }
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Extracted Chunks & OCR Inspector */}
        {selectedDoc && (
          <div className="lg:col-span-6 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Document Inspection
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-sm mt-0.5">
                  {selectedDoc.original_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-indigo-400 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading extracted chunks and tables...</span>
              </div>
            ) : docDetails ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {/* Metrics Summary */}
                {docDetails.metrics && docDetails.metrics.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Extracted Financial Metrics ({docDetails.metrics.length})</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {docDetails.metrics.slice(0, 8).map((m, mIdx) => (
                        <div key={mIdx} className="p-2 rounded bg-slate-900/80 border border-slate-800">
                          <div className="text-slate-400">{m.metric_name}</div>
                          <div className="font-bold text-white mt-0.5">
                            {m.currency}{m.value.toLocaleString()} {m.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chunks List */}
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Extracted Content Chunks ({docDetails.chunks?.length || 0})
                  </span>
                  {docDetails.chunks?.map((chunk, cIdx) => (
                    <div key={cIdx} className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold uppercase text-[10px]">
                          {chunk.chunk_type} (Page {chunk.page_number})
                        </span>
                        {chunk.bounding_box?.x0 && (
                          <span className="font-mono text-[10px] text-slate-500">
                            [{chunk.bounding_box.x0}, {chunk.bounding_box.y0}]
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {chunk.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

