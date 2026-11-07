import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  FileText,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  Table as TableIcon,
  Maximize2,
  Info,
  Clock,
  Filter
} from 'lucide-react';

export default function RAGChatView({
  documents,
  chatHistory,
  onSendMessage,
  onClearHistory,
  isLoading,
  initialPrompt
}) {
  const [inputQuery, setInputQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('all');
  const [activeCitation, setActiveCitation] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputQuery(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    const docId = selectedDocId === 'all' ? null : parseInt(selectedDocId, 10);
    onSendMessage(inputQuery.trim(), docId);
    setInputQuery('');
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    "What was TechCorp's operating margin in Q3 2024?",
    "Identify any duplicate or suspicious transactions in October.",
    "Compare revenue and EBITDA for GlobalRetail between FY23 and FY24.",
    "What are TechCorp's Current Ratio and Debt-to-Equity ratios?"
  ];

  const renderGroundedText = (text, citations) => {
    // Splits by footnote bracket citations [1], [2] and bold **text**
    const parts = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
    return parts.map((part, pIdx) => {
      const citeMatch = part.match(/^\[(\d+)\]$/);
      if (citeMatch) {
        const citeNum = parseInt(citeMatch[1], 10);
        const targetCite = citations?.find(c => (c.citation_index || 1) === citeNum) || citations?.[citeNum - 1];
        return (
          <button
            key={pIdx}
            type="button"
            onClick={() => targetCite && setActiveCitation(targetCite)}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 hover:text-white font-bold text-[10px] border border-indigo-500/30 transition-all cursor-pointer"
            title={`View evidence citation [${citeNum}] in inspector`}
          >
            [{citeNum}]
          </button>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={pIdx}>{part}</span>;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Left 7 Columns: Chat Conversation Stream */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white">Multimodal Financial Reasoning Assistant</h2>
              <p className="text-[11px] text-slate-400">Hybrid Dense + BM25 + Visual Footnote Grounding</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Filter by Document */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">All Documents</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.original_name.slice(0, 24)}</option>
                ))}
              </select>
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={onClearHistory}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-semibold text-white">Ask Anything Across Financial Filings</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Query Form 10-Qs, audit statements, and balance sheets. FinancialSight cross-references tables, text, and visual layouts to provide evidence-backed explanations.
                </p>
              </div>
              {/* Quick suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputQuery(p);
                      onSendMessage(p, selectedDocId === 'all' ? null : parseInt(selectedDocId, 10));
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 text-left text-xs text-slate-300 transition-all flex items-center justify-between group"
                  >
                    <span className="line-clamp-2">{p}</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map((item, idx) => (
              <div key={item.id || idx} className="space-y-3">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-xs text-white shadow-md shadow-indigo-600/20 font-medium">
                    {item.query}
                  </div>
                </div>

                {/* Assistant Grounded Response */}
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 flex-shrink-0 mt-0.5">
                    <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  </div>
                  <div className="flex-1 max-w-[92%] rounded-2xl rounded-tl-sm bg-slate-800/80 border border-slate-700/80 p-4 shadow-sm text-xs text-slate-200">
                    {/* Answer Markdown Render */}
                    <div className="prose prose-invert prose-xs max-w-none space-y-2 leading-relaxed">
                      {item.response.split('\n').map((line, lIdx) => {
                        // Render table headers or lines nicely
                        if (line.startsWith('|')) {
                          return (
                            <div key={lIdx} className="font-mono text-[11px] overflow-x-auto whitespace-pre py-0.5 text-indigo-200">
                              {line}
                            </div>
                          );
                        }
                        if (line.startsWith('### ')) {
                          return <h4 key={lIdx} className="text-xs font-bold text-white mt-2 mb-1">{line.replace('### ', '')}</h4>;
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <li key={lIdx} className="ml-3 list-disc text-slate-300">
                              {renderGroundedText(line.replace('- ', ''), item.citations)}
                            </li>
                          );
                        }
                        return <p key={lIdx} className="text-slate-300">{renderGroundedText(line, item.citations)}</p>;
                      })}
                    </div>

                    {/* Citations badges row */}
                    {item.citations && item.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                          Source References:
                        </span>
                        {item.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setActiveCitation(c)}
                            className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium flex items-center space-x-1 transition-colors"
                          >
                            <span>[{c.citation_index || cIdx + 1}]</span>
                            <span className="max-w-[120px] truncate">{c.metadata?.source_file || `Doc #${c.document_id}`}</span>
                            <span className="text-[10px] text-slate-400">p.{c.page_number}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-2.5 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(item.id || idx, item.response)}
                        className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {copiedId === (item.id || idx) ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center space-x-3 text-xs text-indigo-400 p-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="flex items-center space-x-1 font-medium">
                <span>Retrieving multimodal chunks & synthesizing grounded analysis...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about revenue growth, operating margins, duplicate payments, ratios..."
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Right 5 Columns: Multimodal Grounding & Citation Visual Drawer */}
      <div className="lg:col-span-5 flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white">Multimodal Citation Inspector</h3>
          </div>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Source Grounding
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeCitation ? (
            <div className="space-y-4">
              {/* Citation Header Card */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-xs">
                    Citation [{activeCitation.citation_index || 1}]
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {activeCitation.confidence_percentage}% Confidence Match
                  </span>
                </div>
                <div className="text-xs font-medium text-white flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{activeCitation.metadata?.source_file || `Document #${activeCitation.document_id}`}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                  <div>Page: <span className="text-slate-200 font-semibold">{activeCitation.page_number}</span></div>
                  <div>Chunk Type: <span className="text-slate-200 font-semibold uppercase">{activeCitation.chunk_type}</span></div>
                  <div>Dense Cosine: <span className="text-slate-200 font-mono">{activeCitation.dense_score || '0.85'}</span></div>
                  <div>BM25 Score: <span className="text-slate-200 font-mono">{activeCitation.bm25_score || '3.42'}</span></div>
                </div>
              </div>

              {/* Bounding Box Coordinates */}
              {activeCitation.bounding_box && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400">
                  <div className="font-semibold text-slate-300 mb-1">Extracted Coordinates (Bounding Box):</div>
                  <div className="font-mono text-[10px] text-indigo-300">
                    x0: {activeCitation.bounding_box.x0}, y0: {activeCitation.bounding_box.y0}, x1: {activeCitation.bounding_box.x1}, y1: {activeCitation.bounding_box.y1}
                  </div>
                </div>
              )}

              {/* Visual Thumbnail Preview (Page Render) */}
              {activeCitation.preview_image_path && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Visual Page Layout Preview</span>
                    </span>
                    <a
                      href={activeCitation.preview_image_path}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
                    >
                      <span>Expand</span>
                      <Maximize2 className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950 max-h-56 flex items-center justify-center">
                    <img
                      src={activeCitation.preview_image_path}
                      alt="Citation Page Preview"
                      className="w-full object-contain hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Grounded Text / Table Excerpt */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                  <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Raw Content Excerpt</span>
                </div>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950/80 p-3 rounded-lg max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {activeCitation.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-semibold text-slate-300">No Citation Selected</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Submit an inquiry and click any citation badge (e.g. [1], [2]) to inspect the exact bounding box, layout OCR preview, and table excerpt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
