import csv
import os
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from backend.config import SAMPLES_DIR


def generate_techcorp_pdf(output_path: Path):
    doc = SimpleDocTemplate(str(output_path), pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1e1b4b'), spaceAfter=8)
    h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#312e81'), spaceBefore=12, spaceAfter=6)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=9.5, leading=13, textColor=colors.HexColor('#1f2937'), spaceAfter=6)
    caption_style = ParagraphStyle('CaptionStyle', parent=styles['Italic'], fontSize=8.5, textColor=colors.HexColor('#6b7280'), spaceAfter=8)

    story = []

    # Page 1: Executive Overview & Income Statement
    story.append(Paragraph("TechCorp Global Holdings Inc. – Form 10-Q", title_style))
    story.append(Paragraph("<b>Quarterly Report for the Period Ended September 30, 2024 (Q3 2024)</b>", body_style))
    story.append(Paragraph("Ticker: TCGB (NASDAQ) | Reporting Currency: USD in Millions (except per share amounts)", caption_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Executive Summary & Highlights", h2_style))
    exec_summary = (
        "TechCorp delivered robust performance in Q3 2024, driven by accelerated enterprise adoption of our Cloud AI Platform "
        "and expansion in international software subscriptions. Total quarterly consolidated revenue reached <b>$4,850.0 million</b>, "
        "representing an increase of <b>14.2% year-over-year (YoY)</b> compared to $4,247.0 million in Q3 2023. Gross margin expanded "
        "by 180 basis points to <b>68.4%</b>. Operating income rose 21.5% to <b>$1,420.0 million</b>, reflecting disciplined operational "
        "execution despite continuing macroeconomic headwinds and selective foreign exchange pressures."
    )
    story.append(Paragraph(exec_summary, body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Condensed Consolidated Statements of Income (Unaudited)", h2_style))
    income_data = [
        ["Financial Metric ($ Millions)", "Three Months Ended Sep 30, 2024", "Three Months Ended Sep 30, 2023", "YoY Change (%)"],
        ["Cloud & AI Platform Revenue", "$ 2,740.0", "$ 2,190.0", "+ 25.1 %"],
        ["Enterprise Software Subscriptions", "$ 1,380.0", "$ 1,320.0", "+ 4.5 %"],
        ["Professional Consulting Services", "$ 730.0", "$ 737.0", "- 1.0 %"],
        ["Total Revenue", "$ 4,850.0", "$ 4,247.0", "+ 14.2 %"],
        ["Cost of Revenue", "$ 1,532.0", "$ 1,418.0", "+ 8.0 %"],
        ["Gross Profit", "$ 3,318.0", "$ 2,829.0", "+ 17.3 %"],
        ["Research & Development (R&D)", "$ 980.0", "$ 845.0", "+ 16.0 %"],
        ["Sales & Marketing (S&M)", "$ 610.0", "$ 530.0", "+ 15.1 %"],
        ["General & Administrative (G&A)", "$ 308.0", "$ 285.0", "+ 8.1 %"],
        ["Total Operating Expenses", "$ 1,898.0", "$ 1,660.0", "+ 14.3 %"],
        ["Operating Income (EBIT)", "$ 1,420.0", "$ 1,169.0", "+ 21.5 %"],
        ["Operating Margin", "29.28 %", "27.52 %", "+ 176 bps"],
        ["Income Before Income Taxes", "$ 1,455.0", "$ 1,185.0", "+ 22.8 %"],
        ["Provision for Income Taxes", "$ 262.0", "$ 213.0", "+ 23.0 %"],
        ["Net Income", "$ 1,193.0", "$ 972.0", "+ 22.7 %"],
        ["Diluted EPS ($)", "$ 1.84", "$ 1.48", "+ 24.3 %"]
    ]
    t1 = Table(income_data, colWidths=[200, 115, 115, 90])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e1b4b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'), # Total Revenue
        ('FONTNAME', (0, 6), (-1, 6), 'Helvetica-Bold'), # Gross Profit
        ('FONTNAME', (0, 11), (-1, 11), 'Helvetica-Bold'), # Operating Income
        ('FONTNAME', (0, 15), (-1, 15), 'Helvetica-Bold'), # Net Income
    ]))
    story.append(t1)
    story.append(Paragraph("Source: TechCorp Q3 2024 Financial Filing, Item 1, Page 4.", caption_style))

    story.append(PageBreak())

    # Page 2: Balance Sheet & Liquidity Analysis
    story.append(Paragraph("TechCorp Global Holdings Inc. – Form 10-Q (Continued)", title_style))
    story.append(Paragraph("2. Condensed Consolidated Balance Sheets (Unaudited)", h2_style))

    balance_data = [
        ["Balance Sheet Line Item ($ Millions)", "As of September 30, 2024", "As of December 31, 2023"],
        ["Cash and Cash Equivalents", "$ 8,420.0", "$ 6,850.0"],
        ["Short-Term Marketable Securities", "$ 14,100.0", "$ 13,200.0"],
        ["Accounts Receivable, Net", "$ 3,850.0", "$ 3,410.0"],
        ["Inventories & Prepaids", "$ 1,240.0", "$ 1,090.0"],
        ["Total Current Assets", "$ 27,610.0", "$ 24,550.0"],
        ["Property, Plant & Equipment (PPE), Net", "$ 18,320.0", "$ 16,100.0"],
        ["Goodwill & Intangible Assets", "$ 9,840.0", "$ 9,920.0"],
        ["Other Non-Current Assets", "$ 4,110.0", "$ 3,880.0"],
        ["Total Assets", "$ 59,880.0", "$ 54,450.0"],
        ["Accounts Payable", "$ 2,150.0", "$ 1,980.0"],
        ["Accrued Expenses & Other Current Liabilities", "$ 4,680.0", "$ 4,320.0"],
        ["Current Portion of Long-Term Debt", "$ 1,200.0", "$ 800.0"],
        ["Total Current Liabilities", "$ 8,030.0", "$ 7,100.0"],
        ["Long-Term Debt", "$ 12,500.0", "$ 13,100.0"],
        ["Other Non-Current Liabilities", "$ 5,340.0", "$ 4,950.0"],
        ["Total Liabilities", "$ 25,870.0", "$ 25,150.0"],
        ["Total Stockholders' Equity", "$ 34,010.0", "$ 29,300.0"],
        ["Total Liabilities and Stockholders' Equity", "$ 59,880.0", "$ 54,450.0"]
    ]
    t2 = Table(balance_data, colWidths=[240, 140, 140])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e1b4b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('FONTNAME', (0, 8), (-1, 8), 'Helvetica-Bold'),
        ('FONTNAME', (0, 12), (-1, 12), 'Helvetica-Bold'),
        ('FONTNAME', (0, 15), (-1, 15), 'Helvetica-Bold'),
        ('FONTNAME', (0, 16), (-1, 16), 'Helvetica-Bold'),
    ]))
    story.append(t2)
    story.append(Paragraph("Source: TechCorp Q3 2024 Financial Filing, Item 1, Page 6.", caption_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("3. Liquidity, Solvency & Capital Allocation Ratios", h2_style))
    ratios_narrative = (
        "<b>Current Ratio:</b> As of September 30, 2024, our Current Ratio stood at <b>3.44x</b> "
        "($27,610M / $8,030M) compared to 3.46x as of December 31, 2023, reflecting extraordinary short-term liquidity.<br/>"
        "<b>Debt-to-Equity Ratio:</b> Total Debt of $13,700M over Stockholders' Equity of $34,010M yields a conservative D/E ratio of <b>0.40x</b>.<br/>"
        "<b>Free Cash Flow (FCF):</b> Operating cash flow for the nine months ended September 30, 2024 reached $4,650M. "
        "Capital expenditures totaled $1,280M (principally GPU infrastructure and high-efficiency datacenters), yielding Free Cash Flow of <b>$3,370M</b>."
    )
    story.append(Paragraph(ratios_narrative, body_style))

    doc.build(story)


def generate_globalretail_pdf(output_path: Path):
    doc = SimpleDocTemplate(str(output_path), pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=19, textColor=colors.HexColor('#065f46'), spaceAfter=8)
    h2_style = ParagraphStyle('H2Style', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#047857'), spaceBefore=10, spaceAfter=6)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=9.5, leading=13, textColor=colors.HexColor('#1f2937'), spaceAfter=6)
    caption_style = ParagraphStyle('CaptionStyle', parent=styles['Italic'], fontSize=8.5, textColor=colors.HexColor('#6b7280'), spaceAfter=8)

    story = []

    story.append(Paragraph("GlobalRetail Brands PLC – Annual Report & Accounts", title_style))
    story.append(Paragraph("<b>Fiscal Year Ended June 30, 2024 vs Fiscal Year Ended June 30, 2023</b>", body_style))
    story.append(Paragraph("Reporting Standard: IFRS | Currency: USD in Millions", caption_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Multi-Year Financial Performance Comparison", h2_style))
    overview_text = (
        "GlobalRetail Brands experienced solid omni-channel growth across EMEA and North America. Consolidated annual revenue "
        "expanded to <b>$12,850.0 million</b> in FY2024 from $11,620.0 million in FY2023, an increase of <b>10.58% YoY</b>. "
        "Digital e-commerce sales comprised 34.2% of total retail turnover, up from 29.8% in FY2023. Gross margin increased to <b>44.12%</b> "
        "benefiting from supply chain near-shoring and automated inventory distribution."
    )
    story.append(Paragraph(overview_text, body_style))
    story.append(Spacer(1, 10))

    comp_data = [
        ["Metric Category", "FY 2024 ($M)", "FY 2023 ($M)", "Change ($M)", "YoY Growth (%)"],
        ["North America Store Sales", "$ 6,450.0", "$ 6,100.0", "+ $ 350.0", "+ 5.74 %"],
        ["EMEA Retail & Digital", "$ 4,120.0", "$ 3,650.0", "+ $ 470.0", "+ 12.88 %"],
        ["Asia-Pacific Expansion", "$ 2,280.0", "$ 1,870.0", "+ $ 410.0", "+ 21.93 %"],
        ["Total Consolidated Revenue", "$ 12,850.0", "$ 11,620.0", "+ $ 1,230.0", "+ 10.58 %"],
        ["Cost of Goods Sold (COGS)", "$ 7,180.0", "$ 6,680.0", "+ $ 500.0", "+ 7.49 %"],
        ["Gross Profit", "$ 5,670.0", "$ 4,940.0", "+ $ 730.0", "+ 14.78 %"],
        ["Operating Expenses (SG&A)", "$ 3,920.0", "$ 3,510.0", "+ $ 410.0", "+ 11.68 %"],
        ["Operating Profit (EBITDA)", "$ 1,750.0", "$ 1,430.0", "+ $ 320.0", "+ 22.38 %"],
        ["Net Profit After Tax", "$ 1,025.0", "$ 840.0", "+ $ 185.0", "+ 22.02 %"],
        ["Operating Cash Flow", "$ 1,890.0", "$ 1,510.0", "+ $ 380.0", "+ 25.17 %"],
        ["Active Global Store Count", "1,842 units", "1,720 units", "+ 122 units", "+ 7.09 %"]
    ]
    t1 = Table(comp_data, colWidths=[180, 85, 85, 85, 85])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#065f46')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#a7f3d0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTNAME', (0, 5), (-1, 5), 'Helvetica-Bold'),
        ('FONTNAME', (0, 7), (-1, 7), 'Helvetica-Bold'),
        ('FONTNAME', (0, 8), (-1, 8), 'Helvetica-Bold'),
    ]))
    story.append(t1)
    story.append(Paragraph("Source: GlobalRetail Brands FY24 Financial Statements, Note 3 Segment Reporting, Page 12.", caption_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. Strategic Outlook & Capital Expenditure Guidance", h2_style))
    guidance = (
        "For FY2025, management projects consolidated net revenue between $13,900M and $14,200M (approx. 8-10% growth). "
        "Capital expenditures are guided at $650M - $700M, dedicated to automated fulfillment centers in Rotterdam and Dallas, "
        "as well as omnichannel RFID customer checkout experiences."
    )
    story.append(Paragraph(guidance, body_style))

    doc.build(story)


def generate_invoice_pdf(output_path: Path):
    doc = SimpleDocTemplate(str(output_path), pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1e293b'), spaceAfter=4)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=9.5, leading=13, textColor=colors.HexColor('#334155'))

    story = []
    story.append(Paragraph("<b>TAX INVOICE</b>", title_style))
    story.append(Paragraph("Apex Cloud & Cybersecurity Solutions LLC | Tax ID: US-884920194", body_style))
    story.append(Paragraph("Invoice No: <b>INV-2024-98234</b> | Invoice Date: <b>October 15, 2024</b> | Due Date: <b>November 14, 2024</b>", body_style))
    story.append(Paragraph("Billed To: <b>TechCorp Global Holdings Inc.</b> (Attn: IT Security Directorate)", body_style))
    story.append(Spacer(1, 15))

    inv_table = [
        ["Line", "Service Description", "Qty / Hours", "Rate ($)", "Tax Rate", "Total ($)"],
        ["1", "Zero-Trust Enterprise IAM Architecture Migration", "120 hrs", "$ 225.00", "0.0%", "$ 27,000.00"],
        ["2", "Quarterly Threat Simulation & Penetration Testing", "1 engagement", "$ 18,500.00", "0.0%", "$ 18,500.00"],
        ["3", "High-Availability Multi-Region Kubernetes Cluster Audit", "45 hrs", "$ 210.00", "0.0%", "$ 9,450.00"],
        ["4", "SOC-2 Type II Compliance Readiness Advisory", "1 engagement", "$ 12,000.00", "0.0%", "$ 12,000.00"],
        ["Subtotal", "", "", "", "", "$ 66,950.00"],
        ["State & Municipal Tax (0%)", "", "", "", "", "$ 0.00"],
        ["Total Amount Payable", "", "", "", "", "<b>$ 66,950.00</b>"]
    ]
    t = Table(inv_table, colWidths=[30, 240, 70, 65, 55, 75])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, 4), 0.5, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0, 4), (-1, 4), 1.5, colors.HexColor('#0f172a')),
        ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#f1f5f9')),
        ('FONTNAME', (0, 6), (-1, 6), 'Helvetica-Bold'),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>Wire Transfer Details:</b> JPMorgan Chase N.A., Routing: 021000021, Account: 984029184", body_style))
    story.append(Paragraph("Terms: Net 30 days. Late charges of 1.5% per month applied on past-due balances.", body_style))

    doc.build(story)


def generate_bank_statement_csv(output_path: Path):
    headers = ["Transaction_ID", "Date", "Description", "Category", "Amount", "Currency", "Account_Number", "Reference_Note"]
    
    # 70+ transactions representing regular business expenses + seeded anomalies
    transactions = [
        # Regular expenses
        ["TXN-1001", "2024-10-01", "Amazon Web Services Cloud Hosting", "Cloud Infrastructure", -14250.00, "USD", "ACC-78491", "Monthly Server Clusters"],
        ["TXN-1002", "2024-10-01", "Gusto Monthly Payroll Processing", "Payroll & Benefits", -185200.00, "USD", "ACC-78491", "Direct Deposit Batch 44A"],
        ["TXN-1003", "2024-10-02", "Google Workspace Enterprise", "Software Subscriptions", -1840.00, "USD", "ACC-78491", "650 User Licenses"],
        ["TXN-1004", "2024-10-02", "WeWork Commercial Office Lease", "Office Facilities", -32000.00, "USD", "ACC-78491", "Level 14 Suite 1400"],
        ["TXN-1005", "2024-10-03", "Client Wire Inflow - Acme Corp", "Client Revenue", 125000.00, "USD", "ACC-78491", "Q3 Milestone Payment 2"],
        ["TXN-1006", "2024-10-03", "Delta Airlines Corporate Travel", "Travel & Lodging", -1420.50, "USD", "ACC-78491", "Exec Flight JFK to SFO"],
        ["TXN-1007", "2024-10-04", "Hilton Hotels San Francisco", "Travel & Lodging", -845.20, "USD", "ACC-78491", "Board Conference Stay"],
        ["TXN-1008", "2024-10-05", "Uber Technologies Corporate Account", "Local Transportation", -184.30, "USD", "ACC-78491", "Team Airport Rides"],
        ["TXN-1009", "2024-10-06", "FedEx Express Shipping Logistics", "Operations", -312.10, "USD", "ACC-78491", "Hardware Prototypes"],
        ["TXN-1010", "2024-10-07", "Slack Enterprise Grid Subscription", "Software Subscriptions", -4200.00, "USD", "ACC-78491", "Annual Licensing Tier"],
        ["TXN-1011", "2024-10-08", "GitHub Enterprise Team Seats", "Software Subscriptions", -1250.00, "USD", "ACC-78491", "Engineering Org"],
        ["TXN-1012", "2024-10-08", "Datadog Cloud Monitoring", "Cloud Infrastructure", -5820.00, "USD", "ACC-78491", "APM & Log Ingestion"],
        ["TXN-1013", "2024-10-09", "Stripe Merchant Deposit", "Client Revenue", 94350.00, "USD", "ACC-78491", "SaaS Online Subscriptions"],
        ["TXN-1014", "2024-10-10", "Cooley LLP Legal Counsel", "Legal & Professional", -15400.00, "USD", "ACC-78491", "IP Patent Protection Filing"],
        ["TXN-1015", "2024-10-11", "Zoom Video Communications", "Software Subscriptions", -890.00, "USD", "ACC-78491", "Webinar & Enterprise Addons"],

        # SEEDED ANOMALY 1: Duplicate High-Value Charge (Exact duplicate within 48h)
        ["TXN-1016", "2024-10-12", "Apex Cloud & Cybersecurity Solutions", "Consulting & IT", -66950.00, "USD", "ACC-78491", "Invoice INV-2024-98234 First Wire"],
        ["TXN-1017", "2024-10-13", "Apex Cloud & Cybersecurity Solutions", "Consulting & IT", -66950.00, "USD", "ACC-78491", "DUPLICATE: Re-transmitted Invoice INV-2024-98234"],

        ["TXN-1018", "2024-10-13", "Con Edison Electric Utilities", "Utilities", -1640.20, "USD", "ACC-78491", "Building Server Room Power"],
        ["TXN-1019", "2024-10-14", "Salesforce CRM Enterprise", "Software Subscriptions", -11400.00, "USD", "ACC-78491", "Global Sales Seats"],
        ["TXN-1020", "2024-10-15", "Gusto Bi-Weekly Payroll Processing", "Payroll & Benefits", -186100.00, "USD", "ACC-78491", "Direct Deposit Batch 44B"],
        ["TXN-1021", "2024-10-16", "Client Wire Inflow - Meridian Financial", "Client Revenue", 210000.00, "USD", "ACC-78491", "Annual Enterprise Contract"],

        # SEEDED ANOMALY 2: Unusual Sunday Luxury Jewelry & Watch Charge (High Deviation from Category)
        ["TXN-1022", "2024-10-20", "Bucherer 1888 Fifth Avenue Luxury Watches", "Office Facilities", -18450.00, "USD", "ACC-78491", "Suspicious Misclassified Luxury Spend on Sunday"],

        ["TXN-1023", "2024-10-21", "Snowflake Data Cloud Data Warehouse", "Cloud Infrastructure", -8900.00, "USD", "ACC-78491", "Compute Credits Consumption"],
        ["TXN-1024", "2024-10-22", "Catering & Employee Morale Luncheon", "Meals & Entertainment", -740.00, "USD", "ACC-78491", "All-Hands Catering"],
        ["TXN-1025", "2024-10-23", "Palo Alto Networks Firewall Renewal", "Consulting & IT", -14200.00, "USD", "ACC-78491", "Perimeter Defense License"],
        ["TXN-1026", "2024-10-24", "Stripe Merchant Deposit", "Client Revenue", 88920.00, "USD", "ACC-78491", "SaaS Online Subscriptions"],

        # SEEDED ANOMALY 3: Large Round-Dollar Off-Hours Wire to Unverified Offshore Entity
        ["TXN-1027", "2024-10-26", "Wire Transfer - Horizon Seychelle Capital Ltd", "Miscellaneous", -100000.00, "USD", "ACC-78491", "Round $100K Outflow without Purchase Order"],

        ["TXN-1028", "2024-10-27", "Atlassian Jira & Confluence Cloud", "Software Subscriptions", -2300.00, "USD", "ACC-78491", "Product Management Tools"],
        ["TXN-1029", "2024-10-28", "Dell Technologies Workstations", "Hardware & Equipment", -19450.00, "USD", "ACC-78491", "10x AI Developer Laptops"],
        ["TXN-1030", "2024-10-29", "KPMG Audit & Assurance Fees", "Legal & Professional", -28000.00, "USD", "ACC-78491", "Interim Q3 Review"],
        ["TXN-1031", "2024-10-30", "Client Wire Inflow - Vantage Biotech", "Client Revenue", 145000.00, "USD", "ACC-78491", "Platform License Payment"],
        ["TXN-1032", "2024-10-31", "Gusto Bi-Weekly Payroll Processing", "Payroll & Benefits", -187300.00, "USD", "ACC-78491", "Direct Deposit Batch 44C"],
        ["TXN-1033", "2024-10-31", "Interest Earned Money Market", "Interest Income", 14820.00, "USD", "ACC-78491", "JPMorgan Cash Sweep Account"]
    ]

    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(transactions)


def ensure_samples():
    """Generates default realistic sample financial files if they don't exist."""
    p1 = SAMPLES_DIR / "TechCorp_Q3_2024_Financial_Report.pdf"
    if not p1.exists():
        generate_techcorp_pdf(p1)

    p2 = SAMPLES_DIR / "GlobalRetail_Annual_Report_2023_2024.pdf"
    if not p2.exists():
        generate_globalretail_pdf(p2)

    p3 = SAMPLES_DIR / "Vendor_Invoice_INV-2024-98234.pdf"
    if not p3.exists():
        generate_invoice_pdf(p3)

    p4 = SAMPLES_DIR / "Corporate_Bank_Statement_Oct2024.csv"
    if not p4.exists():
        generate_bank_statement_csv(p4)

    return [p1, p2, p3, p4]

