import os
import json
import uuid
import shutil
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import UPLOAD_DIR, REPORTS_DIR, THUMBNAILS_DIR, GEMINI_API_KEY, BASE_DIR
from backend.database import (
    init_db,
    get_db,
    SessionLocal,
    DocumentModel,
    DocumentChunkModel,
    FinancialMetricModel,
    TransactionModel,
    ChatHistoryModel
)
from backend.services.sample_generator import ensure_samples
from backend.services.extractor import DocumentExtractor
from backend.services.vector_store import HybridVectorStore
from backend.services.rag_engine import FinancialRAGEngine
from backend.services.analytics import FinancialAnalytics
from backend.services.report_generator import ReportGenerator

# Initialize DB tables
init_db()

# Global in-memory Hybrid Vector Store
vector_store = HybridVectorStore()

# Global RAG Engine
rag_engine = FinancialRAGEngine()


def sync_vector_store(db: Session):
    """Loads all existing chunks into the hybrid vector store."""
    chunks = db.query(DocumentChunkModel).all()
    chunk_dicts = [c.to_dict() for c in chunks]
    vector_store.clear()
    vector_store.add_chunks(chunk_dicts)


# Auto-sync on module load if database already has chunks
_db_init = SessionLocal()
try:
    if _db_init.query(DocumentChunkModel).count() > 0:
        sync_vector_store(_db_init)
finally:
    _db_init.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        doc_count = db.query(DocumentModel).count()
        if doc_count == 0:
            sample_paths = ensure_samples()
            for p in sample_paths:
                _process_and_store_file(p, p.name, db)
        sync_vector_store(db)
    finally:
        db.close()
    yield


# Create FastAPI app
app = FastAPI(
    title="FinancialSight API",
    description="Multimodal Financial Intelligence Assistant with Hybrid RAG & Anomaly Detection",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas
class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    document_id: Optional[int] = None


class ConfigKeyRequest(BaseModel):
    api_key: str


def sync_vector_store(db: Session):
    """Loads all existing chunks into the hybrid vector store."""
    chunks = db.query(DocumentChunkModel).all()
    chunk_dicts = [c.to_dict() for c in chunks]
    vector_store.clear()
    vector_store.add_chunks(chunk_dicts)


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        # Check if documents exist; if none, generate samples and ingest them
        doc_count = db.query(DocumentModel).count()
        if doc_count == 0:
            sample_paths = ensure_samples()
            for p in sample_paths:
                _process_and_store_file(p, p.name, db)
        sync_vector_store(db)
    finally:
        db.close()


def _process_and_store_file(file_path: Path, original_filename: str, db: Session) -> DocumentModel:
    file_ext = file_path.suffix.lower()
    file_type = "pdf" if file_ext == ".pdf" else ("csv" if file_ext == ".csv" else ("xlsx" if file_ext in [".xlsx", ".xls"] else "image"))
    file_size = os.path.getsize(file_path)

    doc_entry = DocumentModel(
        filename=file_path.name,
        original_name=original_filename,
        file_type=file_type,
        file_size=file_size,
        status="processing"
    )
    db.add(doc_entry)
    db.commit()
    db.refresh(doc_entry)

    try:
        if file_type == "pdf":
            chunks, metrics, meta = DocumentExtractor.extract_pdf(file_path, doc_entry.id)
            transactions = []
        elif file_type in ["csv", "xlsx"]:
            chunks, transactions, metrics, meta = DocumentExtractor.extract_tabular_data(file_path, doc_entry.id)
        else:
            chunks = []
            transactions = []
            metrics = []
            meta = {}

        # Run anomaly detection on transactions if present
        anomaly_count = 0
        if transactions:
            transactions = FinancialAnalytics.detect_transaction_anomalies(transactions)
            anomaly_count = sum(1 for t in transactions if t.get("is_anomaly"))

        # Save Chunks
        for c in chunks:
            chunk_row = DocumentChunkModel(
                document_id=doc_entry.id,
                chunk_index=c["chunk_index"],
                chunk_type=c["chunk_type"],
                content=c["content"],
                page_number=c.get("page_number", 1),
                bounding_box_json=json.dumps(c.get("bounding_box", {})),
                preview_image_path=c.get("preview_image_path", ""),
                metadata_json=json.dumps(c.get("metadata", {}))
            )
            db.add(chunk_row)

        # Save Metrics
        for m in metrics:
            metric_row = FinancialMetricModel(
                document_id=doc_entry.id,
                company_name=m["company_name"],
                fiscal_year=m["fiscal_year"],
                fiscal_quarter=m["fiscal_quarter"],
                metric_name=m["metric_name"],
                value=m["value"],
                unit=m["unit"],
                currency=m["currency"],
                source_page=m["source_page"],
                source_snippet=m["source_snippet"]
            )
            db.add(metric_row)

        # Save Transactions
        for t in transactions:
            txn_row = TransactionModel(
                document_id=doc_entry.id,
                transaction_date=str(t["transaction_date"]),
                description=str(t["description"]),
                category=str(t.get("category", "General")),
                amount=float(t["amount"]),
                currency=str(t.get("currency", "USD")),
                account_number=str(t.get("account_number", "ACC-1")),
                is_anomaly=bool(t.get("is_anomaly", False)),
                anomaly_reason=str(t.get("anomaly_reason", "")),
                anomaly_score=float(t.get("anomaly_score", 0.0)),
                anomaly_severity=str(t.get("anomaly_severity", "Low"))
            )
            db.add(txn_row)

        doc_entry.status = "processed"
        doc_entry.total_pages = meta.get("total_pages", 1)
        doc_entry.extracted_tables_count = meta.get("tables_found", 0) + (1 if meta.get("is_ledger") else 0)
        doc_entry.anomaly_count = anomaly_count
        doc_entry.summary = f"Processed {file_type.upper()} with {len(chunks)} chunks, {len(metrics)} financial metrics, and {len(transactions)} transactions."
        doc_entry.metadata_json = json.dumps(meta)
        db.commit()

        # Update Vector Store
        db_chunks = db.query(DocumentChunkModel).filter(DocumentChunkModel.document_id == doc_entry.id).all()
        vector_store.add_chunks([c.to_dict() for c in db_chunks])

    except Exception as e:
        doc_entry.status = "error"
        doc_entry.summary = f"Extraction failed: {str(e)}"
        db.commit()

    return doc_entry


# --- Document Endpoints ---

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Uploads a financial document (PDF, CSV, Excel, Image) and triggers extraction."""
    original_filename = file.filename
    unique_name = f"{uuid.uuid4().hex[:8]}_{original_filename}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc_record = _process_and_store_file(file_path, original_filename, db)
    return doc_record.to_dict()


@app.get("/api/documents")
def list_documents(db: Session = Depends(get_db)):
    """Lists all uploaded/ingested documents."""
    docs = db.query(DocumentModel).order_by(DocumentModel.upload_date.desc()).all()
    return [d.to_dict() for d in docs]


@app.get("/api/documents/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_db)):
    """Gets details for a single document including metrics and chunks."""
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    data = doc.to_dict()
    data["chunks"] = [c.to_dict() for c in doc.chunks]
    data["metrics"] = [m.to_dict() for m in doc.metrics]
    data["anomalies"] = [t.to_dict() for t in doc.transactions if t.is_anomaly]
    return data


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    """Deletes a document and synchronizes vector store."""
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    sync_vector_store(db)
    return {"status": "success", "message": f"Document {doc_id} deleted"}


@app.post("/api/documents/load-samples")
def load_sample_documents(db: Session = Depends(get_db)):
    """Loads pre-built realistic sample financial documents."""
    sample_paths = ensure_samples()
    loaded = []
    for p in sample_paths:
        existing = db.query(DocumentModel).filter(DocumentModel.original_name == p.name).first()
        if not existing:
            doc = _process_and_store_file(p, p.name, db)
            loaded.append(doc.to_dict())
    sync_vector_store(db)
    return {"status": "success", "loaded_count": len(loaded), "loaded": loaded}


@app.get("/api/documents/thumbnail/{filename}")
def get_thumbnail(filename: str):
    """Serves rendered PDF page thumbnails for visual citations."""
    file_path = THUMBNAILS_DIR / filename
    if not file_path.exists():
        # Check if wildcard match
        matches = list(THUMBNAILS_DIR.glob(filename.replace("*", "*")))
        if matches:
            file_path = matches[0]
        else:
            raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(file_path, media_type="image/png")


# --- Multimodal RAG Query Endpoints ---

@app.post("/api/rag/query")
def execute_rag_query(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Performs multimodal hybrid retrieval (Dense + BM25 + RRF) and context-grounded answer generation.
    Returns:
        response: Markdown-formatted answer
        citations: Evidence list with page numbers, bounding boxes, and preview URLs
    """
    if not vector_store.chunks:
        sync_vector_store(db)

    retrieved_chunks = vector_store.search(
        query=request.query,
        top_k=request.top_k or 5,
        filter_doc_id=request.document_id
    )

    answer, citations = rag_engine.generate_answer(request.query, retrieved_chunks)

    # Record in chat history
    chat_record = ChatHistoryModel(
        query=request.query,
        response=answer,
        citations_json=json.dumps(citations)
    )
    db.add(chat_record)
    db.commit()

    return {
        "query": request.query,
        "answer": answer,
        "citations": citations,
        "retrieval_count": len(citations),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/rag/history")
def get_chat_history(db: Session = Depends(get_db)):
    """Retrieves recent conversation history."""
    records = db.query(ChatHistoryModel).order_by(ChatHistoryModel.timestamp.desc()).limit(20).all()
    return [r.to_dict() for r in records]


@app.post("/api/rag/clear-history")
def clear_chat_history(db: Session = Depends(get_db)):
    db.query(ChatHistoryModel).delete()
    db.commit()
    return {"status": "success", "message": "Chat history cleared"}


# --- Analytics & Financial Comparisons ---

@app.get("/api/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """Returns top-level KPIs for dashboard cards."""
    doc_count = db.query(DocumentModel).count()
    chunk_count = db.query(DocumentChunkModel).count()
    metric_count = db.query(FinancialMetricModel).count()
    txns = db.query(TransactionModel).all()
    anomaly_count = sum(1 for t in txns if t.is_anomaly)

    total_inflows = sum(t.amount for t in txns if t.amount > 0)
    total_outflows = abs(sum(t.amount for t in txns if t.amount < 0))

    return {
        "documents_count": doc_count,
        "indexed_chunks": chunk_count,
        "financial_metrics_extracted": metric_count,
        "anomalies_detected": anomaly_count,
        "total_inflows": total_inflows,
        "total_outflows": total_outflows,
        "net_cash_flow": total_inflows - total_outflows,
        "gemini_active": bool(rag_engine.client is not None)
    }


@app.get("/api/analytics/compare")
def compare_companies(db: Session = Depends(get_db)):
    """Cross-company and multi-period performance comparison."""
    metrics = db.query(FinancialMetricModel).all()
    metric_dicts = [m.to_dict() for m in metrics]
    return FinancialAnalytics.compare_performance(metric_dicts)


@app.get("/api/analytics/anomalies")
def get_detected_anomalies(severity: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists detected transaction anomalies with severity and explanations."""
    q = db.query(TransactionModel).filter(TransactionModel.is_anomaly == True)
    if severity and severity.lower() != "all":
        q = q.filter(TransactionModel.anomaly_severity == severity.capitalize())
    anomalies = q.order_by(TransactionModel.anomaly_score.desc()).all()
    return [a.to_dict() for a in anomalies]


@app.get("/api/analytics/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db)):
    """Aggregates transaction spending by category."""
    txns = db.query(TransactionModel).filter(TransactionModel.amount < 0).all()
    cats = {}
    for t in txns:
        cat = t.category or "General"
        cats[cat] = cats.get(cat, 0.0) + abs(t.amount)

    return [{"category": k, "amount": round(v, 2)} for k, v in sorted(cats.items(), key=lambda x: x[1], reverse=True)]


# --- Report Generation & Export ---

@app.post("/api/reports/generate-pdf")
def generate_pdf_report(db: Session = Depends(get_db)):
    """Generates an executive PDF intelligence report and returns download path."""
    metrics = [m.to_dict() for m in db.query(FinancialMetricModel).all()]
    anomalies = [t.to_dict() for t in db.query(TransactionModel).filter(TransactionModel.is_anomaly == True).all()]
    documents = [d.to_dict() for d in db.query(DocumentModel).all()]

    pdf_path = ReportGenerator.generate_pdf_report(
        title="FinancialSight Intelligence Synthesis",
        summary_text="Comprehensive audit of corporate filings, segment revenues, liquidity ratios, and transactional anomaly detection.",
        metrics=metrics,
        anomalies=anomalies,
        documents=documents
    )

    return {
        "status": "success",
        "filename": pdf_path.name,
        "download_url": f"/api/reports/download/{pdf_path.name}"
    }


@app.get("/api/reports/download/{filename}")
def download_pdf_report(filename: str):
    file_path = REPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(file_path, filename=filename, media_type="application/pdf")


@app.get("/api/reports/export-anomalies-csv")
def export_anomalies_csv(db: Session = Depends(get_db)):
    anomalies = [t.to_dict() for t in db.query(TransactionModel).filter(TransactionModel.is_anomaly == True).all()]
    csv_path = ReportGenerator.generate_anomalies_csv(anomalies)
    return FileResponse(csv_path, filename=csv_path.name, media_type="text/csv")


# --- System Status & Key Configuration ---

@app.get("/api/system/status")
def get_system_status():
    return {
        "status": "healthy",
        "gemini_api_configured": bool(rag_engine.client is not None),
        "total_indexed_chunks": len(vector_store.chunks),
        "embedding_method": "Gemini text-embedding-004 + TF-IDF Hybrid Projection",
        "search_strategy": "Hybrid Dense + Okapi BM25 + RRF Reranking"
    }


@app.post("/api/system/configure-key")
def configure_api_key(request: ConfigKeyRequest):
    """Allows setting or updating Gemini API key dynamically from UI."""
    global rag_engine
    key = request.api_key.strip()
    rag_engine = FinancialRAGEngine(api_key=key)
    return {
        "status": "success",
        "gemini_api_configured": bool(rag_engine.client is not None),
        "message": "Gemini API Key updated successfully"
    }


# --- Static Frontend Serving ---
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

