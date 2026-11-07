import csv
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from backend.config import REPORTS_DIR


class ReportGenerator:
    """Generates downloadable PDF and CSV intelligence reports."""

    @staticmethod
    def generate_pdf_report(
        title: str,
        summary_text: str,
        metrics: List[Dict[str, Any]],
        anomalies: List[Dict[str, Any]],
        documents: List[Dict[str, Any]]
    ) -> Path:
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"FinancialSight_Intelligence_Report_{timestamp_str}.pdf"
        output_path = REPORTS_DIR / filename

        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'RepTitle', parent=styles['Heading1'],
            fontSize=22, textColor=colors.HexColor('#0f172a'), spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'RepSub', parent=styles['Normal'],
            fontSize=10, textColor=colors.HexColor('#475569'), spaceAfter=14
        )
        h2_style = ParagraphStyle(
            'RepH2', parent=styles['Heading2'],
            fontSize=13, textColor=colors.HexColor('#1e293b'), spaceBefore=12, spaceAfter=6
        )
        body_style = ParagraphStyle(
            'RepBody', parent=styles['Normal'],
            fontSize=9.5, leading=14, textColor=colors.HexColor('#334155'), spaceAfter=8
        )

        story = []

        # Header Banner
        story.append(Paragraph("<b>FinancialSight Intelligence Report</b>", title_style))
        story.append(Paragraph(f"Executive Synthesis & Anomaly Audit | Generated: {datetime.now().strftime('%B %d, %Y - %H:%M UTC')}", subtitle_style))
        story.append(Spacer(1, 8))

        # 1. Executive Summary
        story.append(Paragraph("1. Executive Summary & Portfolio Overview", h2_style))
        exec_p = (
            summary_text or
            "This report consolidates multimodal financial filings, balance sheets, and transaction logs. "
            "Automated audit algorithms and hybrid RAG retrieval identified key corporate performance metrics, "
            "cross-period growth patterns, and flagged suspicious disbursements requiring immediate management oversight."
        )
        story.append(Paragraph(exec_p, body_style))
        story.append(Spacer(1, 8))

        # 2. Key Financial Metrics Table
        if metrics:
            story.append(Paragraph("2. Extracted Financial Metrics & Key Performance Indicators (KPIs)", h2_style))
            metrics_table_data = [["Company", "Period", "Metric", "Value", "Source"]]
            for m in metrics[:12]:
                val_formatted = f"${m['value']:,.2f}" if "$" in m.get("currency", "") else f"{m['value']} {m.get('unit', '')}"
                metrics_table_data.append([
                    m.get("company_name", ""),
                    f"{m.get('fiscal_quarter', '')} {m.get('fiscal_year', '')}",
                    m.get("metric_name", ""),
                    val_formatted,
                    f"Page {m.get('source_page', 1)}"
                ])

            t_metrics = Table(metrics_table_data, colWidths=[120, 60, 160, 110, 80])
            t_metrics.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
            ]))
            story.append(t_metrics)
            story.append(Spacer(1, 10))

        # 3. Transaction Anomalies & Risk Flags
        if anomalies:
            story.append(Paragraph("3. Flagged Transaction Anomalies & Spending Irregularities", h2_style))
            anom_table_data = [["Date", "Description", "Amount ($)", "Severity", "Audit Reason"]]
            for a in anomalies[:10]:
                amt_str = f"${abs(a.get('amount', 0)):,.2f}"
                sev = a.get("anomaly_severity", "Medium")
                anom_table_data.append([
                    a.get("transaction_date", ""),
                    Paragraph(a.get("description", "")[:35], body_style),
                    amt_str,
                    sev,
                    Paragraph(a.get("anomaly_reason", ""), body_style)
                ])

            t_anom = Table(anom_table_data, colWidths=[65, 130, 75, 55, 205])
            t_anom.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#991b1b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fecaca')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff1f2')])
            ]))
            story.append(t_anom)
            story.append(Spacer(1, 10))

        # 4. Ingested Evidence Sources
        story.append(Paragraph("4. Analyzed Document Sources", h2_style))
        doc_list_text = "<br/>".join([
            f"• <b>{d.get('original_name', 'File')}</b> ({d.get('file_type', '').upper()}, {d.get('total_pages', 1)} pages, {d.get('extracted_tables_count', 0)} tables extracted)"
            for d in documents
        ])
        story.append(Paragraph(doc_list_text, body_style))

        doc.build(story)
        return output_path

    @staticmethod
    def generate_anomalies_csv(anomalies: List[Dict[str, Any]]) -> Path:
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"FinancialSight_Anomalies_{timestamp_str}.csv"
        output_path = REPORTS_DIR / filename

        headers = ["Transaction_Date", "Description", "Category", "Amount", "Currency", "Severity", "Anomaly_Score", "Audit_Reason"]
        with open(output_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            for a in anomalies:
                writer.writerow([
                    a.get("transaction_date", ""),
                    a.get("description", ""),
                    a.get("category", ""),
                    a.get("amount", ""),
                    a.get("currency", "USD"),
                    a.get("anomaly_severity", ""),
                    a.get("anomaly_score", ""),
                    a.get("anomaly_reason", "")
                ])

        return output_path

