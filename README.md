# FinancialSight – Multimodal Financial Intelligence Assistant

**FinancialSight** is an enterprise-grade, intermediate-level AI-powered Multimodal RAG application designed to analyze, understand, audit, and compare financial information across diverse sources—including Form 10-K/10-Q PDFs, bank statement spreadsheets, invoices, receipts, and visual reports.

---

## 🌟 Key Capabilities

### 1. Multimodal Document Extraction & Ingestion
- **PDF Form 10-Q/10-K & Annual Reports:** Uses PyMuPDF (`fitz`) to extract structured text blocks, table cells, bounding box coordinates (`x0, y0, x1, y1`), and renders visual page layouts at high DPI for thumbnail grounding.
- **Bank Statements & Spreadsheets:** Uses `pandas` to parse multi-column financial ledgers, auto-detecting transaction dates, merchant descriptions, expense categories, debit/credit flows, and net cash positions.
- **Invoices & Scanned Receipts:** Extracts structured vendor information, line items, tax breakdowns, and payment terms.

### 2. Multimodal Hybrid RAG & Grounded Answer Generation
- **Hybrid Retrieval Pipeline:**
  - **Dense Semantic Projection:** Normalized subword embeddings + Gemini `text-embedding-004`.
  - **Lexical Keyword Search:** Okapi BM25 ranking ($k_1=1.5, b=0.75$).
  - **Reciprocal Rank Fusion (RRF):** Merges dense and lexical rankings ($RRF(d) = \sum \frac{1}{60 + \text{rank}}$).
  - **Domain-Specific Reranker:** Heuristically promotes structured tables for numerical/margin queries and visual captures for trend queries.
- **Exact Evidence Footnotes:** Every answer is grounded with citation footnotes (e.g. `[1]`, `[2]`), document name, page number, confidence score, bounding box, and visual thumbnail preview.
- **Dual Engine:** Seamlessly uses Google Gemini 2.5/1.5 Flash via `google-genai` when an API key is provided, with an automatic offline financial reasoning synthesizer when offline or keyless.

### 3. Transaction Anomaly & Fraud Audit
- **Statistical Z-Score Outlier Analysis:** Flags expenses where $|Z| > 2.5$.
- **IQR Fence Rules:** Flags disbursements exceeding $Q3 + (1.5 \times IQR)$.
- **Duplicate Payment Matching:** Identifies duplicate charges to the same vendor within short time windows (e.g. duplicated $66,950 wire).
- **Round-Dollar Off-Hours Wire Detection:** Detects suspicious large round disbursements ($10,000, $50,000, $100,000) lacking purchase order references.
- **Weekend High-Value Spikes:** Identifies unusual Saturday/Sunday commercial expenditures.
- **Severity Classification:** Classifies risks into `High`, `Medium`, and `Low` with human-readable audit justifications.

### 4. Cross-Company & Multi-Period Comparison
- **Normalized Side-by-Side Metrics:** Revenue, Gross Profit, Operating Income (EBIT), Operating Margin, Net Profit, Current Ratio, Free Cash Flow.
- **YoY / QoQ Growth & Basis Point Variances:** Compares performance trajectories (e.g. TechCorp Q3 2024 vs Q3 2023, GlobalRetail FY24 vs FY23).
- **Interactive Visualizations:** Comparative Recharts bar and line charts.

### 5. Downloadable Executive Intelligence Reports
- **Executive PDF Report:** Generates a publication-ready PDF using `reportlab`, complete with executive summary, KPI tables, flagged anomalies, and evidence source footnotes.
- **CSV / JSON Exports:** Instant download of detected anomalies and financial metrics.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Tailwind CSS, Recharts, Lucide Icons, Vite |
| **Backend** | Python 3, FastAPI, Uvicorn, Pydantic |
| **Document Processing** | PyMuPDF (`fitz`), Pillow, Pandas, OpenPyXL |
| **Vector DB & Search** | Hybrid Dense + Okapi BM25 + Reciprocal Rank Fusion (RRF) |
| **Database** | SQLite (default out-of-the-box) / PostgreSQL via SQLAlchemy |
| **LLM & Vision** | Google Gemini 2.5 Flash / Gemini 1.5 Flash (`google-genai`) |
| **Data Analysis** | NumPy, SciPy, Scikit-learn, ReportLab |

---

## 🚀 Quick Start Guide

### 1. Clone / Navigate to Workspace
```bash
cd f:\FinancialSight
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. (Optional) Set your Gemini API Key
You can set an environment variable or configure it directly in the UI via the **"API Key"** button:
```bash
set GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: FinancialSight works 100% out-of-the-box even without an API key using the integrated hybrid RAG engine and financial reasoning fallback!)*

### 4. Run the Application
```bash
python run_app.py
```
Or double-click `start.bat`.

Open your browser at:
👉 **`http://localhost:8000`**

---

## 📂 Project Architecture

```
FinancialSight/
├── backend/
│   ├── config.py              # Environment configuration & directory paths
│   ├── database.py            # SQLAlchemy models (Document, Chunks, Metrics, Transactions)
│   ├── main.py                # FastAPI routes, RAG endpoints & SPA static serving
│   └── services/
│       ├── extractor.py       # PyMuPDF text/table/visual extraction & OCR
│       ├── vector_store.py    # Hybrid Vector Store (Dense + BM25 + RRF reranker)
│       ├── rag_engine.py      # Context-grounded generation & citation engine
│       ├── analytics.py       # Anomaly detection (Z-score, IQR, duplicates) & comparison
│       ├── sample_generator.py# Generates realistic 10-Qs, Annual Reports & Bank CSVs
│       └── report_generator.py# ReportLab executive PDF & CSV report generator
├── frontend/
│   ├── src/
│   │   ├── api.js             # Frontend API client
│   │   ├── App.jsx            # Main view router & state management
│   │   ├── components/
│   │   │   ├── Header.jsx           # Navigation, status badges & quick actions
│   │   │   ├── DashboardView.jsx    # Executive KPI cards, Recharts & prompt launchpad
│   │   │   ├── RAGChatView.jsx      # Multimodal RAG chat & Visual Citation Drawer
│   │   │   ├── ComparisonView.jsx   # Cross-company & multi-period matrix & charts
│   │   │   ├── AnomalyAuditView.jsx # Transaction audit, severity filters & CSV export
│   │   │   ├── DocumentManagerView.jsx # Drag-and-drop ingestion & chunk inspector
│   │   │   └── ApiKeyModal.jsx      # Gemini API key configuration dialog
│   │   └── index.css          # Tailwind CSS styles & modern glassmorphism
│   ├── package.json
│   └── vite.config.js
├── samples/                   # Pre-built realistic financial files
│   ├── TechCorp_Q3_2024_Financial_Report.pdf
│   ├── GlobalRetail_Annual_Report_2023_2024.pdf
│   ├── Vendor_Invoice_INV-2024-98234.pdf
│   └── Corporate_Bank_Statement_Oct2024.csv
├── run_app.py                 # Single-command application launcher
├── start.bat                  # Windows batch launcher
├── requirements.txt           # Python dependencies
└── README.md                  # Documentation
```

---

## 📊 Pre-Loaded Realistic Datasets

When first launched, FinancialSight automatically provides 4 realistic corporate datasets:
1. **TechCorp Global Holdings Inc. (Form 10-Q Q3 2024):** Consolidated statement of income, balance sheet, liquidity ratios ($27.6B current assets, 3.44x current ratio), Cloud AI revenue expansion ($2.74B, +25.1% YoY), and operating margin breakdown (29.28%, +176 bps).
2. **GlobalRetail Brands PLC (Annual Report FY23 vs FY24):** Omni-channel e-commerce growth, segment performance (EMEA, North America, APAC), store count (1,842 units), and gross margin evolution (44.12%, +161 bps).
3. **Corporate Bank Statement (October 2024 CSV):** Over 30 transactions with payroll, cloud infrastructure, office lease, and **injected financial anomalies** (duplicate $66,950 invoice wire, $18,450 Sunday luxury watch spend, round $100,000 offshore transfer).
4. **Vendor Tax Invoice (Apex Cloud Solutions LLC):** Itemized cybersecurity audit line items, payment terms, and wire details.

