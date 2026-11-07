import uvicorn
import sys
import os

if __name__ == "__main__":
    print("=" * 65)
    print("  FinancialSight – Multimodal Financial Intelligence Assistant")
    print("=" * 65)
    print("Starting server at: http://localhost:8000")
    print("Serving integrated React UI + FastAPI Multimodal RAG Backend")
    print("Press Ctrl+C to terminate.")
    print("=" * 65)
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)

