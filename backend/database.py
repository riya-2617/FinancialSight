import json
from datetime import datetime
from typing import Generator
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    Boolean,
    ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.config import DATABASE_URL

# SQLite requires check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, xlsx, csv, image
    file_size = Column(Integer, default=0)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="processed")  # processing, processed, error
    total_pages = Column(Integer, default=1)
    extracted_tables_count = Column(Integer, default=0)
    anomaly_count = Column(Integer, default=0)
    summary = Column(Text, default="")
    metadata_json = Column(Text, default="{}")

    chunks = relationship("DocumentChunkModel", back_populates="document", cascade="all, delete-orphan")
    metrics = relationship("FinancialMetricModel", back_populates="document", cascade="all, delete-orphan")
    transactions = relationship("TransactionModel", back_populates="document", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "original_name": self.original_name,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "upload_date": self.upload_date.isoformat() if self.upload_date else None,
            "status": self.status,
            "total_pages": self.total_pages,
            "extracted_tables_count": self.extracted_tables_count,
            "anomaly_count": self.anomaly_count,
            "summary": self.summary,
            "metadata": json.loads(self.metadata_json) if self.metadata_json else {}
        }


class DocumentChunkModel(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0)
    chunk_type = Column(String(50), default="text")  # text, table, chart, metric
    content = Column(Text, nullable=False)
    page_number = Column(Integer, default=1)
    bounding_box_json = Column(Text, default="{}")  # {x0, y0, x1, y1}
    preview_image_path = Column(String(500), default="")
    dense_embedding_json = Column(Text, default="")
    metadata_json = Column(Text, default="{}")

    document = relationship("DocumentModel", back_populates="chunks")

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "chunk_type": self.chunk_type,
            "content": self.content,
            "page_number": self.page_number,
            "bounding_box": json.loads(self.bounding_box_json) if self.bounding_box_json else {},
            "preview_image_path": self.preview_image_path,
            "metadata": json.loads(self.metadata_json) if self.metadata_json else {}
        }


class FinancialMetricModel(Base):
    __tablename__ = "financial_metrics"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name = Column(String(100), default="Unknown Corp")
    fiscal_year = Column(Integer, default=2024)
    fiscal_quarter = Column(String(10), default="Q3")  # Q1, Q2, Q3, Q4, FY
    metric_name = Column(String(100), nullable=False)   # Revenue, Net Income, Operating Margin, etc.
    value = Column(Float, nullable=False)
    unit = Column(String(20), default="USD")           # USD, %, millions
    currency = Column(String(10), default="$")
    source_page = Column(Integer, default=1)
    source_snippet = Column(Text, default="")

    document = relationship("DocumentModel", back_populates="metrics")

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "company_name": self.company_name,
            "fiscal_year": self.fiscal_year,
            "fiscal_quarter": self.fiscal_quarter,
            "metric_name": self.metric_name,
            "value": self.value,
            "unit": self.unit,
            "currency": self.currency,
            "source_page": self.source_page,
            "source_snippet": self.source_snippet
        }


class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_date = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    category = Column(String(100), default="General")
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    account_number = Column(String(50), default="ACC-***123")
    is_anomaly = Column(Boolean, default=False)
    anomaly_reason = Column(String(255), default="")
    anomaly_score = Column(Float, default=0.0)
    anomaly_severity = Column(String(20), default="Low")  # Low, Medium, High

    document = relationship("DocumentModel", back_populates="transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "transaction_date": self.transaction_date,
            "description": self.description,
            "category": self.category,
            "amount": self.amount,
            "currency": self.currency,
            "account_number": self.account_number,
            "is_anomaly": self.is_anomaly,
            "anomaly_reason": self.anomaly_reason,
            "anomaly_score": self.anomaly_score,
            "anomaly_severity": self.anomaly_severity
        }


class ChatHistoryModel(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    citations_json = Column(Text, default="[]")
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "query": self.query,
            "response": self.response,
            "citations": json.loads(self.citations_json) if self.citations_json else [],
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

