# FinancialSight – Comprehensive Project Documentation & Technical Specification

> **A Multimodal Financial Intelligence & Anomaly Audit Platform**  
> *Built with React, Tailwind CSS, Recharts, FastAPI, PyMuPDF, Hybrid RAG (Dense + BM25 + RRF), and Google Gemini.*

---

## 1. Executive Overview

**FinancialSight** is an enterprise-grade AI financial intelligence platform designed to ingest, process, verify, audit, and compare financial data from disparate enterprise sources:
- Form 10-K/10-Q SEC filings & corporate annual reports (PDF)
- Corporate bank statements & transaction ledgers (CSV / Excel)
- Vendor invoices & billing statements (PDF)
- Scanned commercial receipts & financial layout charts (PNG / JPG)

FinancialSight solves the hallucinations and lack of explainability common in conventional financial LLM chatbots by implementing **Multimodal Retrieval-Augmented Generation (RAG)** grounded in exact footnote citations, bounding-box coordinate tracking, and visual layout rendering. Every assertion made by the assistant is tied to a specific page number, table cell, or visual image excerpt.

---

## 2. Core Capabilities & Feature Matrix

| Feature | Description | Implementation |
|---|---|---|
| **Multimodal Document Processing** | Parses text, tables, numbers, and layout figures across PDFs, spreadsheets, and scanned documents. | PyMuPDF (`fitz`), Pillow, Pandas, OpenPyXL |
| **Multimodal Hybrid RAG** | Combines semantic cosine similarity with Okapi BM25 keyword retrieval and Reciprocal Rank Fusion (RRF). | Scikit-learn, NumPy, Gemini `text-embedding-004` |
| **Evidence Footnote Citations** | Attaches bracketed citations `[1]`, `[2]` linking directly to page numbers, bounding boxes, and visual thumbnail previews. | Interactive React Citation Inspector & PyMuPDF layout coords |
| **Transaction Anomaly & Fraud Audit** | Multi-layered statistical and rule-based anomaly detection engine identifying suspicious disbursements. | Z-Score ($|Z| > 2.5$), IQR fences, duplicate matching, round-dollar flags |
| **Cross-Company & Multi-Period Comparison** | Side-by-side financial metric matrix comparing revenues, gross profit, operating margins, EBIT, and cash flows. | Pandas aggregation & Recharts comparative bar/line visualizations |
| **Interactive Financial Modeling** | Built-in what-if simulation suite: DCF Gordon Growth Valuation, DuPont 3-Way ROE Decomposition, Margin Sensitivity. | Interactive React modeling engine with live parameter sliders |
| **Executive Report Generation** | Generates publication-ready PDF intelligence summaries and downloadable CSV audit tables. | ReportLab Platypus engine & Python CSV writer |
| **Dynamic Key & Privacy Control** | Dual-mode operation: connects to Google Gemini 2.5 Flash when API key is provided, with full offline analytical fallback. | FastAPI runtime configuration & offline financial synthesizer |

---

## 3. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              React 18 Analytics Dashboard                              │
│         Tailwind CSS • Recharts Data Visualizations • Lucide Icons • Vite SPA          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST API Requests (/api/*)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FastAPI Backend Server                                 │
├──────────────────────────┬────────────────────────────┬────────────────────────────────┤
│   Document Extractor     │    Hybrid Vector Store     │     Context-Grounded Engine    │
│  - PyMuPDF text & tables │  - Dense Cosine Similarity │  - Google Gemini 2.5 Flash     │
│  - Visual page rendering │  - Okapi BM25 Lexical      │  - Footnote evidence citations │
│  - Pandas CSV/XLSX       │  - Reciprocal Rank Fusion  │  - Calculation transparency    │
├──────────────────────────┼────────────────────────────┼────────────────────────────────┤
│   Analytics & Anomalies  │   Financial Modeler        │     Report Generator           │
│  - Z-Score & IQR fences  │  - 5-Yr DCF Gordon Growth  │  - ReportLab PDF Compiler      │
│  - Duplicate detection   │  - DuPont 3-Way ROE        │  - CSV Export Engine           │
│  - Off-hours / round wire│  - Margin Sensitivity      │  - Executive Summarizer        │
└──────────────────────────┴────────────────────────────┴────────────────────────────────┘
                                            │ SQLAlchemy ORM
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          Database (SQLite / PostgreSQL)                                │
│    - Documents       - DocumentChunks       - FinancialMetrics       - Transactions    │
│    - ChatHistory     - GeneratedReports     - AuditTrails            - KeyMetadata     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Deep-Dive: Multimodal Document Extraction & OCR Pipeline

The extraction subsystem is located in `backend/services/extractor.py`.

### 4.1. PDF Extraction (PyMuPDF / fitz)
1. **Layout & Block Segmentation**: Iterates through each page using `page.get_text("blocks")` to extract text blocks, coordinate bounding boxes `(x0, y0, x1, y1)`, block indices, and content types.
2. **Tabular Heuristics**: Detects structured rows containing currency indicators (`$`), percentages (`%`), and columnar spacing.
3. **Visual Page Thumbnail Rendering**: Every page is rendered to high-DPI PNGs via `page.get_pixmap(dpi=130)` and stored in `uploads/thumbnails/`. This powers the **Visual Citation Inspector** in the UI, enabling users to visually verify numbers against the original filing.
4. **Automated KPI Harvesting**: Regular expression extractors normalize standard financial line items (Revenue, Gross Profit, Operating Income, Operating Margin, Net Income, Current Ratio, Debt-to-Equity, Free Cash Flow).

### 4.2. Tabular Data (CSV & Excel)
1. **Schema Auto-Detection**: Inspects header signatures to differentiate transaction ledgers (`Date`, `Description`, `Amount`, `Category`) from multi-period balance sheets.
2. **Ledger Ingestion**: Parses debits, credits, timestamps, and account numbers, converting rows into structured financial transactions and passing them directly to the anomaly detection engine.

---

## 5. Deep-Dive: Multimodal Hybrid RAG Engine

The retrieval pipeline is located in `backend/services/vector_store.py`.

### 5.1. Dense Semantic Similarity
- Computes dense semantic representations over character and word n-grams with sublinear TF scaling.
- Evaluates pairwise cosine similarity:
  $$\text{Cosine}(q, d) = \frac{q \cdot d}{\|q\| \|d\|}$$

### 5.2. Lexical Okapi BM25 Ranking
- Tokenizes queries into normalized alphanumeric tokens.
- Evaluates Okapi BM25 scores with standard corporate tuning parameters ($k_1 = 1.5, b = 0.75$):
  $$\text{BM25}(D, Q) = \sum_{i=1}^{n} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

### 5.3. Reciprocal Rank Fusion (RRF) & Domain Reranker
- Combines disparate ranking distributions into a unified rank score:
  $$\text{RRF\_Score}(d) = \frac{1}{60 + \text{Rank}_{\text{dense}}(d)} + \frac{1}{60 + \text{Rank}_{\text{bm25}}(d)}$$
- **Domain Reranking Boosts**:
  - If query targets quantitative/margin terms (`revenue`, `ebitda`, `margin`, `ratio`), structured table chunks receive a **+35% rank boost**.
  - If query targets trends or visual layouts (`chart`, `trend`, `graph`, `visual`), visual page chunks receive a **+40% rank boost**.

---

## 6. Deep-Dive: Transaction Anomaly & Fraud Audit Engine

Located in `backend/services/analytics.py`, this module analyzes corporate expense ledgers:

1. **Statistical Z-Score Outlier Flagging**:
   $$Z = \frac{X - \mu}{\sigma}$$
   Disbursements with $|Z| > 2.5$ receive `Medium` severity; $|Z| > 3.0$ receive `High` severity.
2. **Interquartile Range (IQR) Upper Fence**:
   $$\text{Upper Fence} = Q_3 + (1.5 \times \text{IQR})$$
3. **Suspected Duplicate Payment Matching**:
   Identifies duplicate outflows matching on normalized vendor string and exact dollar amount within a 72-hour window.
4. **Round-Dollar Off-Hours Wire Detection**:
   Flags large round-dollar disbursements ($\ge \$10,000$ and divisible by $\$1,000$) lacking verified purchase order numbers.
5. **Weekend High-Value Spikes**:
   Flags transactions $> \$5,000$ executed on Saturdays or Sundays under commercial accounts.

---

## 7. Deep-Dive: Interactive Financial Modeling

Located in `frontend/src/components/FinancialCalculatorView.jsx`:

1. **Discounted Cash Flow (DCF) 5-Year Gordon Growth**:
   $$\text{PV} = \sum_{t=1}^{5} \frac{\text{FCF}_0 \cdot (1 + g)^t}{(1 + r)^t} + \frac{\text{FCF}_5 \cdot (1 + g_{\text{term}})}{(r - g_{\text{term}}) \cdot (1 + r)^5}$$
2. **DuPont 3-Way ROE Decomposition**:
   $$\text{ROE} = \left(\frac{\text{Net Income}}{\text{Revenue}}\right) \times \left(\frac{\text{Revenue}}{\text{Total Assets}}\right) \times \left(\frac{\text{Total Assets}}{\text{Stockholders' Equity}}\right)$$
3. **Operating Margin Sensitivity**:
   Models real-time EBIT impact given fluctuating top-line revenue growth, COGS percentages, and OpEx expansion.

---

## 8. Complete Tech Stack & Library Rationale

| Component | Library / Framework | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React.js | 18.3.1 | Component-driven UI architecture |
| **Build Tool** | Vite | 6.0.7 | Lightning-fast HMR and optimized production bundling |
| **Styling** | Tailwind CSS | 3.4.17 | Modern dark-mode financial UI with glassmorphism |
| **Data Visualization** | Recharts | 2.15.1 | Composed bar, line, and category breakdown charts |
| **Icons** | Lucide-React | 1.16.0 | Professional UI icons |
| **Backend Framework** | FastAPI | 0.136.0 | High-performance asynchronous Python API |
| **ASGI Server** | Uvicorn | 0.46.0 | Fast ASGI web server |
| **PDF Extraction & Layout** | PyMuPDF (`fitz`) | 2.0.0 | High-speed PDF text, bounding box, and image rasterization |
| **Data Analysis** | Pandas & NumPy | 3.0.2 / 2.4.4 | Tabular manipulation, statistics, and financial modeling |
| **Machine Learning & NLP** | Scikit-Learn | 1.8.0 | TF-IDF subword vectorization and cosine metrics |
| **PDF Report Compilation** | ReportLab | 5.1.0 | Programmatic executive PDF intelligence reports |
| **Spreadsheet Ingestion** | OpenPyXL | 3.1.5 | Microsoft Excel XLSX ingestion |
| **Generative AI & LLM** | Google GenAI SDK | 2.34.0 | Gemini 2.5 Flash multimodal vision & reasoning |
| **Database ORM** | SQLAlchemy | 2.1.4 | Relational persistence with SQLite/PostgreSQL support |

---

## 9. REST API Specification

### Document Management
- `POST /api/documents/upload`: Uploads a financial file (PDF, CSV, XLSX, PNG, JPG), triggers extraction, chunks, indexes into vector store.
- `GET /api/documents`: Lists all ingested documents with page counts, table counts, and anomaly counts.
- `GET /api/documents/{id}`: Returns detailed document metadata, extracted chunks, and financial metrics.
- `DELETE /api/documents/{id}`: Deletes document and cleans vector index.
- `POST /api/documents/load-samples`: Preloads the 4 built-in financial sample filings.
- `GET /api/documents/thumbnail/{filename}`: Serves rendered high-DPI page thumbnails for visual grounding.

### Multimodal RAG Assistant
- `POST /api/rag/query`: Accepts `{ query: string, top_k: int, document_id: int? }`, executes hybrid search (Dense + BM25 + RRF), generates answer with footnote citations `[1]`, `[2]`.
- `GET /api/rag/history`: Retrieves persistent chat history with source citations.
- `POST /api/rag/clear-history`: Clears conversation history.

### Analytics & Anomaly Audit
- `GET /api/analytics/overview`: Top-level portfolio metrics (total documents, indexed chunks, verified metrics, anomaly count, net inflows/outflows).
- `GET /api/analytics/compare`: Cross-company and multi-period financial comparison tables and YoY growth rates.
- `GET /api/analytics/anomalies`: Filterable transaction anomalies by severity (`All`, `High`, `Medium`).
- `GET /api/analytics/category-breakdown`: Aggregated spending distribution by merchant category.

### Reports & System
- `POST /api/reports/generate-pdf`: Compiles executive PDF report and returns download link.
- `GET /api/reports/download/{filename}`: Downloads compiled PDF report.
- `GET /api/reports/export-anomalies-csv`: Exports flagged anomalies as CSV.
- `GET /api/system/status`: Returns system health, indexed chunk count, and Gemini connectivity.
- `POST /api/system/configure-key`: Configures or updates the Gemini API key at runtime.

---

## 10. Database Schema (SQLAlchemy Models)

```
┌────────────────────────┐       1:N       ┌────────────────────────┐
│     DocumentModel      ├────────────────►│   DocumentChunkModel   │
├────────────────────────┤                 ├────────────────────────┤
│ id (PK)                │                 │ id (PK)                │
│ filename               │                 │ document_id (FK)       │
│ original_name          │                 │ chunk_index            │
│ file_type              │                 │ chunk_type             │
│ file_size              │                 │ content                │
│ upload_date            │                 │ page_number            │
│ status                 │                 │ bounding_box_json      │
│ total_pages            │                 │ preview_image_path     │
│ extracted_tables_count │                 │ metadata_json          │
│ anomaly_count          │                 └────────────────────────┘
│ summary                │
│ metadata_json          │       1:N       ┌────────────────────────┐
└──────────┬─────────────┼────────────────►│  FinancialMetricModel  │
           │             │                 ├────────────────────────┤
           │             │                 │ id (PK)                │
           │             │                 │ document_id (FK)       │
           │             │                 │ company_name           │
           │             │                 │ fiscal_year            │
           │             │                 │ fiscal_quarter         │
           │             │                 │ metric_name            │
           │             │                 │ value, unit, currency  │
           │             │                 │ source_page, snippet   │
           │             │                 └────────────────────────┘
           │             │       1:N       ┌────────────────────────┐
           │             └────────────────►│    TransactionModel    │
           │                               ├────────────────────────┤
           │                               │ id (PK)                │
           │                               │ document_id (FK)       │
           │                               │ transaction_date       │
           │                               │ description            │
           │                               │ category               │
           │                               │ amount, currency       │
           │                               │ is_anomaly             │
           │                               │ anomaly_reason         │
           │                               │ anomaly_score          │
           │                               │ anomaly_severity       │
           │                               └────────────────────────┘
           ▼
┌────────────────────────┐
│    ChatHistoryModel    │
├────────────────────────┤
│ id (PK)                │
│ query                  │
│ response               │
│ citations_json         │
│ timestamp              │
└────────────────────────┘
```

---

## 11. Pre-Loaded Realistic Corporate Datasets

1. **TechCorp Global Holdings Inc. (Form 10-Q Q3 2024 PDF)**:
   - \$4,850.0M Revenue (+14.2% YoY)
   - Cloud AI Segment: \$2,740.0M (+25.1% YoY)
   - Operating Income: \$1,420.0M (+21.5% YoY), Operating Margin 29.28% (+176 bps)
   - Current Ratio: 3.44x, Debt-to-Equity: 0.40x, Free Cash Flow: \$3,370M
2. **GlobalRetail Brands PLC (Annual Accounts FY23 vs FY24 PDF)**:
   - Consolidated Revenue: \$12,850.0M (+10.58% YoY)
   - Gross Margin: 44.12% (+161 bps)
   - EBITDA: \$1,750.0M (+22.38% YoY)
   - Operating Cash Flow: \$1,890.0M (+25.17% YoY), Store count: 1,842 units
3. **Corporate Bank Statement (October 2024 CSV)**:
   - 33 detailed transactions totaling \$678,090 inflows and \$975,992 disbursements.
   - **Injected anomalies**: Duplicate \$66,950.00 wire within 24 hours, \$18,450.00 Sunday luxury watch spend, round \$100,000 offshore wire without purchase order.
4. **Apex Cloud Solutions Tax Invoice (INV-2024-98234 PDF)**:
   - Itemized enterprise IAM migration, pen-testing, and SOC-2 audit charges totaling \$66,950.00.

---

## 12. Quick Start & Execution

### Option A: Single-Command Launch (Recommended)
```powershell
python run_app.py
```
*(Or double-click `start.bat` on Windows)*

Open browser at:
👉 **`http://localhost:8000`**

### Option B: Development Mode (with Hot Module Reloading)
```powershell
# Terminal 1 - Backend
python -m uvicorn backend.main:app --port 8000 --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Option C: Automated Verification Suite
```powershell
python verify_direct.py
```
Validates all endpoints, vector indices, anomaly models, RAG generation, and PDF compilation.
