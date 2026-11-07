import json
from backend.database import get_db
from backend.main import (
    get_system_status,
    get_analytics_overview,
    list_documents,
    compare_companies,
    get_detected_anomalies,
    execute_rag_query,
    generate_pdf_report,
    QueryRequest
)

def run_direct_verification():
    db = next(get_db())
    try:
        print("1. Testing get_system_status()...")
        status = get_system_status()
        print("System status:", status)
        assert status["status"] == "healthy"

        print("\n2. Testing get_analytics_overview()...")
        overview = get_analytics_overview(db)
        print("Overview:", overview)
        assert overview["documents_count"] >= 4
        assert overview["anomalies_detected"] > 0

        print("\n3. Testing list_documents()...")
        docs = list_documents(db)
        print(f"Documents count: {len(docs)}")
        for d in docs:
            print(f" - [{d['id']}] {d['original_name']} ({d['file_type']}): {d['total_pages']} pages, {d['extracted_tables_count']} tables, {d['anomaly_count']} anomalies")
        assert len(docs) >= 4

        print("\n4. Testing get_detected_anomalies()...")
        anomalies = get_detected_anomalies(severity="All", db=db)
        print(f"Total anomalies: {len(anomalies)}")
        for a in anomalies[:5]:
            print(f" - [{a['anomaly_severity']}] {a['transaction_date']} | {a['description']} | ${abs(a['amount']):,.2f} | {a['anomaly_reason']}")
        assert len(anomalies) > 0

        print("\n5. Testing compare_companies()...")
        comparison = compare_companies(db)
        print("Companies:", comparison["companies"])
        print("Growth analysis items:", len(comparison["growth_analysis"]))
        print("Sample metrics comparison rows:", len(comparison["comparison_table"]))
        assert len(comparison["companies"]) >= 2

        print("\n6. Testing execute_rag_query()...")
        query_req = QueryRequest(query="What was TechCorp operating margin in Q3 2024?", top_k=5)
        rag_res = execute_rag_query(query_req, db)
        print("RAG Query:", rag_res["query"])
        print("\nRAG Answer:\n", rag_res["answer"])
        print(f"\nCitations count: {len(rag_res['citations'])}")
        for c in rag_res["citations"][:3]:
            print(f" Citation [{c.get('citation_index')}]: {c.get('metadata', {}).get('source_file')} p.{c.get('page_number')} ({c.get('chunk_type')}) - Conf: {c.get('confidence_percentage')}%")
        assert len(rag_res["citations"]) > 0

        print("\n7. Testing Executive PDF Report generation...")
        pdf_res = generate_pdf_report(db)
        print("Generated PDF:", pdf_res)
        assert pdf_res["status"] == "success"

        print("\n=======================================================")
        print(">>> SUCCESS: ALL DIRECT ENDPOINT AUDITS PASSED 100%! <<<")
        print("=======================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_direct_verification()

