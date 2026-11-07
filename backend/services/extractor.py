import os
import json
import uuid
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple
import pymupdf as fitz
import pandas as pd
from PIL import Image

from backend.config import THUMBNAILS_DIR, GEMINI_API_KEY


class DocumentExtractor:
    """Multimodal document extractor for PDFs, Excel/CSV files, and images."""

    @staticmethod
    def extract_pdf(file_path: Path, doc_id: int) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
        """
        Extracts text chunks, tables, and page visual thumbnails from a PDF.
        Returns:
            chunks: List of chunk dicts
            extracted_metrics: List of financial metric dicts
            metadata: Summary info
        """
        doc = fitz.open(str(file_path))
        chunks = []
        metrics = []
        total_pages = len(doc)
        tables_found = 0

        # Company name heuristic
        company_name = "TechCorp Global Holdings" if "techcorp" in file_path.name.lower() else (
            "GlobalRetail Brands" if "globalretail" in file_path.name.lower() else "Corporate Entity"
        )

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1

            # Render page image thumbnail for multimodal visual citation
            pix = page.get_pixmap(dpi=130)
            thumb_filename = f"doc_{doc_id}_p{page_num}_{uuid.uuid4().hex[:6]}.png"
            thumb_path = THUMBNAILS_DIR / thumb_filename
            pix.save(str(thumb_path))
            rel_thumb_url = f"/api/documents/thumbnail/{thumb_filename}"

            # Extract text blocks
            blocks = page.get_text("blocks")
            # blocks structure: (x0, y0, x1, y1, text, block_no, block_type)

            page_full_text = ""
            for b_idx, b in enumerate(blocks):
                x0, y0, x1, y1, text, block_no, block_type = b
                cleaned_text = text.strip()
                if not cleaned_text:
                    continue

                page_full_text += cleaned_text + "\n"

                # Detect if block contains structured table data (e.g. multiple lines with dollar signs or percentages)
                is_table = ("$" in cleaned_text and "\n" in cleaned_text) or ("%" in cleaned_text and "\n" in cleaned_text)

                bbox = {
                    "x0": round(x0, 2),
                    "y0": round(y0, 2),
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "width": round(page.rect.width, 2),
                    "height": round(page.rect.height, 2)
                }

                chunk_type = "table" if is_table else "text"
                if is_table:
                    tables_found += 1

                chunks.append({
                    "chunk_index": len(chunks),
                    "chunk_type": chunk_type,
                    "content": cleaned_text,
                    "page_number": page_num,
                    "bounding_box": bbox,
                    "preview_image_path": rel_thumb_url,
                    "metadata": {
                        "block_id": block_no,
                        "source_file": file_path.name,
                        "page": page_num
                    }
                })

            # Check for financial metrics on this page
            DocumentExtractor._extract_financial_metrics_from_text(
                page_full_text, page_num, company_name, metrics
            )

        # Create a visual chart/page chunk for each page
        for page_idx in range(total_pages):
            thumb_filename = f"doc_{doc_id}_p{page_idx+1}_visual.png"
            chunks.append({
                "chunk_index": len(chunks),
                "chunk_type": "visual_page",
                "content": f"[Visual Layout Page {page_idx+1}] Full visual capture of financial report page {page_idx+1} for {company_name}.",
                "page_number": page_idx + 1,
                "bounding_box": {"x0": 0, "y0": 0, "x1": 600, "y1": 800},
                "preview_image_path": f"/api/documents/thumbnail/doc_{doc_id}_p{page_idx+1}_*.png",
                "metadata": {"type": "page_overview", "page": page_idx + 1}
            })

        metadata = {
            "total_pages": total_pages,
            "tables_found": tables_found,
            "company_name": company_name,
            "file_type": "pdf"
        }

        doc.close()
        return chunks, metrics, metadata

    @staticmethod
    def _extract_financial_metrics_from_text(text: str, page_num: int, company_name: str, metrics_list: List[Dict]):
        """Rule-based and regex extraction of canonical financial metrics."""
        patterns = [
            (r"(?:Total\s+Revenue|Consolidated\s+Revenue)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Total Revenue", "USD Millions"),
            (r"(?:Gross\s+Profit)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Gross Profit", "USD Millions"),
            (r"(?:Operating\s+Income|Operating\s+Profit|EBIT)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Operating Income", "USD Millions"),
            (r"(?:Net\s+Income|Net\s+Profit)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Net Income", "USD Millions"),
            (r"(?:Operating\s+Margin)[\s:]+([\d,]+(?:\.\d+)?)\s*%", "Operating Margin", "%"),
            (r"(?:Gross\s+Margin)[\s:]+([\d,]+(?:\.\d+)?)\s*%", "Gross Margin", "%"),
            (r"(?:Total\s+Assets)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Total Assets", "USD Millions"),
            (r"(?:Total\s+Liabilities)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Total Liabilities", "USD Millions"),
            (r"(?:Cash\s+and\s+Cash\s+Equivalents)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Cash & Equivalents", "USD Millions"),
            (r"(?:Free\s+Cash\s+Flow|FCF)[\s:]+\$?\s*([\d,]+(?:\.\d+)?)", "Free Cash Flow", "USD Millions"),
            (r"(?:Current\s+Ratio)[\s:]+([\d,]+(?:\.\d+)?)\s*x?", "Current Ratio", "Ratio"),
            (r"(?:Debt-to-Equity|D/E)[\s:]+([\d,]+(?:\.\d+)?)\s*x?", "Debt-to-Equity", "Ratio"),
        ]

        year = 2024
        quarter = "Q3"
        if "2023" in text and "2024" not in text:
            year = 2023
        if "FY" in text or "Annual" in text:
            quarter = "FY"

        for pat, metric_name, unit in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                val_str = match.group(1).replace(",", "")
                try:
                    val = float(val_str)
                    # Deduplicate in current list
                    if not any(m["metric_name"] == metric_name and m["source_page"] == page_num for m in metrics_list):
                        metrics_list.append({
                            "company_name": company_name,
                            "fiscal_year": year,
                            "fiscal_quarter": quarter,
                            "metric_name": metric_name,
                            "value": val,
                            "unit": unit,
                            "currency": "$" if "USD" in unit else "",
                            "source_page": page_num,
                            "source_snippet": text[max(0, match.start() - 30): min(len(text), match.end() + 30)].strip()
                        })
                except ValueError:
                    pass

    @staticmethod
    def extract_tabular_data(file_path: Path, doc_id: int) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
        """
        Parses CSV or Excel spreadsheet.
        Returns:
            chunks: List of text/table chunks
            transactions: List of parsed financial transactions (if ledger format)
            metrics: List of financial metrics (if financial report format)
            metadata: Extracted summary
        """
        if file_path.suffix.lower() == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        chunks = []
        transactions = []
        metrics = []

        cols = [c.lower() for c in df.columns]

        # Determine if transaction ledger or financial statement
        is_transaction_ledger = any("amount" in c or "debit" in c or "credit" in c or "transaction" in c for c in cols)

        if is_transaction_ledger:
            # Map columns
            date_col = next((c for c in df.columns if "date" in c.lower()), df.columns[0])
            desc_col = next((c for c in df.columns if "desc" in c.lower() or "merchant" in c.lower() or "narrative" in c.lower()), df.columns[1])
            amount_col = next((c for c in df.columns if "amount" in c.lower() or "net" in c.lower()), df.columns[2])
            cat_col = next((c for c in df.columns if "cat" in c.lower() or "type" in c.lower()), None)
            account_col = next((c for c in df.columns if "account" in c.lower()), None)

            for idx, row in df.iterrows():
                try:
                    raw_amt = str(row[amount_col]).replace("$", "").replace(",", "").strip()
                    amt = float(raw_amt)
                    date_val = str(row[date_col])
                    desc_val = str(row[desc_col])
                    cat_val = str(row[cat_col]) if cat_col else "General"
                    acc_val = str(row[account_col]) if account_col else "ACC-PRIMARY"

                    transactions.append({
                        "transaction_date": date_val,
                        "description": desc_val,
                        "category": cat_val,
                        "amount": amt,
                        "currency": "USD",
                        "account_number": acc_val,
                        "is_anomaly": False,
                        "anomaly_reason": "",
                        "anomaly_score": 0.0,
                        "anomaly_severity": "Low"
                    })
                except Exception:
                    continue

            # Create tabular overview chunk
            table_markdown = df.head(30).to_markdown()
            chunks.append({
                "chunk_index": 0,
                "chunk_type": "table",
                "content": f"### Corporate Bank Statement & Transactions\n\nTotal recorded rows: {len(df)}\n\n{table_markdown}",
                "page_number": 1,
                "bounding_box": {"x0": 10, "y0": 10, "x1": 500, "y1": 500},
                "preview_image_path": "",
                "metadata": {"type": "transaction_ledger", "rows_count": len(df)}
            })

            # Also create summary chunk
            total_inflows = sum(t["amount"] for t in transactions if t["amount"] > 0)
            total_outflows = sum(t["amount"] for t in transactions if t["amount"] < 0)
            summary_content = (
                f"Transaction Statement Summary:\n"
                f"- Total Recorded Transactions: {len(transactions)}\n"
                f"- Total Revenue / Inflows: ${total_inflows:,.2f}\n"
                f"- Total Outflows / Disbursements: ${abs(total_outflows):,.2f}\n"
                f"- Net Cash Flow: ${(total_inflows + total_outflows):,.2f}"
            )
            chunks.append({
                "chunk_index": 1,
                "chunk_type": "text",
                "content": summary_content,
                "page_number": 1,
                "bounding_box": {"x0": 10, "y0": 510, "x1": 500, "y1": 600},
                "preview_image_path": "",
                "metadata": {"type": "transaction_summary"}
            })

            metadata = {
                "file_type": "csv/xlsx",
                "total_rows": len(df),
                "is_ledger": True,
                "transaction_count": len(transactions)
            }

        else:
            # General financial sheet
            table_md = df.to_markdown()
            chunks.append({
                "chunk_index": 0,
                "chunk_type": "table",
                "content": f"### Financial Table Sheet\n\n{table_md}",
                "page_number": 1,
                "bounding_box": {"x0": 0, "y0": 0, "x1": 500, "y1": 500},
                "preview_image_path": "",
                "metadata": {"columns": list(df.columns)}
            })
            metadata = {
                "file_type": "csv/xlsx",
                "total_rows": len(df),
                "is_ledger": False
            }

        return chunks, transactions, metrics, metadata
