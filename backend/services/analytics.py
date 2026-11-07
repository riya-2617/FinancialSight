import numpy as np
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime


class FinancialAnalytics:
    """Analytical engine for anomaly detection, ratio calculations, and multi-period comparisons."""

    @staticmethod
    def detect_transaction_anomalies(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Runs multi-layered anomaly detection algorithms over a list of financial transactions:
        1. Statistical Z-Score outlier detection
        2. IQR (Interquartile Range) fence rule
        3. Duplicate / near-duplicate transaction matching
        4. Large round-dollar transaction flagging
        5. Off-hours / weekend high-value spending
        """
        if not transactions:
            return []

        df = pd.DataFrame(transactions)
        # Ensure numeric amounts
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
        df["abs_amount"] = df["amount"].abs()
        df["is_anomaly"] = False
        df["anomaly_reason"] = ""
        df["anomaly_score"] = 0.0
        df["anomaly_severity"] = "Low"

        # Separate expenses (outflows) vs inflows for statistical calculations
        expense_mask = df["amount"] < 0
        expense_amounts = df.loc[expense_mask, "abs_amount"]

        if len(expense_amounts) > 4:
            mean_exp = expense_amounts.mean()
            std_exp = expense_amounts.std() if expense_amounts.std() > 0 else 1.0

            q25 = expense_amounts.quantile(0.25)
            q75 = expense_amounts.quantile(0.75)
            iqr = q75 - q25
            upper_fence = q75 + (1.5 * iqr)

            # 1. Z-Score outliers
            z_scores = (expense_amounts - mean_exp) / std_exp
            for idx, z in z_scores.items():
                if z > 2.5:
                    df.at[idx, "is_anomaly"] = True
                    df.at[idx, "anomaly_reason"] = f"Statistical Outlier (Z-score: {z:.2f}, exceeds standard deviation threshold)"
                    df.at[idx, "anomaly_score"] = min(0.99, float(z / 4.0))
                    df.at[idx, "anomaly_severity"] = "High" if z > 3.0 else "Medium"

            # 2. IQR outliers (if not already high)
            for idx in expense_amounts[expense_amounts > upper_fence].index:
                if not df.at[idx, "is_anomaly"]:
                    df.at[idx, "is_anomaly"] = True
                    df.at[idx, "anomaly_reason"] = f"Expense exceeds IQR upper fence (${upper_fence:,.2f})"
                    df.at[idx, "anomaly_score"] = 0.75
                    df.at[idx, "anomaly_severity"] = "Medium"

        # 3. Duplicate Transaction Detection (Same vendor and same amount within close dates)
        seen_charges = {}
        for idx, row in df.iterrows():
            # Key by vendor normalized and rounded amount
            desc_key = "".join(filter(str.isalnum, row["description"][:15].lower()))
            amt_key = round(row["amount"], 2)
            combo_key = (desc_key, amt_key)

            if combo_key in seen_charges and abs(amt_key) > 500:
                prev_idx, prev_date = seen_charges[combo_key]
                df.at[idx, "is_anomaly"] = True
                df.at[idx, "anomaly_reason"] = f"Suspected Duplicate Payment of ${abs(amt_key):,.2f} matching transaction on {prev_date}"
                df.at[idx, "anomaly_score"] = 0.95
                df.at[idx, "anomaly_severity"] = "High"
            else:
                seen_charges[combo_key] = (idx, row.get("transaction_date", ""))

        # 4. Large round-dollar transaction flagging (e.g. exactly 50,000 or 100,000 disbursement)
        for idx, row in df.iterrows():
            amt = row["abs_amount"]
            if row["amount"] < 0 and amt >= 10000 and amt % 1000 == 0:
                reason = df.at[idx, "anomaly_reason"]
                if reason:
                    df.at[idx, "anomaly_reason"] += "; Even round-dollar outflow without PO reference"
                else:
                    df.at[idx, "is_anomaly"] = True
                    df.at[idx, "anomaly_reason"] = f"Abnormal Round-Dollar Outflow (${amt:,.0f}) flagged for audit"
                    df.at[idx, "anomaly_score"] = max(df.at[idx, "anomaly_score"], 0.82)
                    df.at[idx, "anomaly_severity"] = "High"

        # 5. Weekend high spend detection
        for idx, row in df.iterrows():
            date_str = str(row.get("transaction_date", ""))
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                if dt.weekday() in [5, 6] and row["abs_amount"] > 5000:
                    curr_reason = df.at[idx, "anomaly_reason"]
                    if not curr_reason:
                        df.at[idx, "is_anomaly"] = True
                        df.at[idx, "anomaly_reason"] = f"Unusual High-Value Weekend Transaction on {dt.strftime('%A')} (${row['abs_amount']:,.2f})"
                        df.at[idx, "anomaly_score"] = 0.88
                        df.at[idx, "anomaly_severity"] = "High"
            except Exception:
                pass

        # Return sanitized dicts
        result = []
        for _, row in df.iterrows():
            d = row.to_dict()
            d.pop("abs_amount", None)
            result.append(d)

        return result

    @staticmethod
    def compare_performance(metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Organizes financial metrics into comparative views:
        - Cross-company side-by-side
        - Multi-year / multi-quarter trends
        - Margin variances and growth rates
        """
        if not metrics:
            return {"companies": [], "comparison_table": [], "growth_analysis": []}

        df = pd.DataFrame(metrics)
        companies = sorted(list(df["company_name"].unique()))

        # Group metrics
        table_rows = []
        grouped = df.groupby("metric_name")

        for metric_name, group in grouped:
            row_data = {"metric": metric_name, "unit": group.iloc[0]["unit"]}
            for _, r in group.iterrows():
                key = f"{r['company_name']} ({r['fiscal_quarter']} {r['fiscal_year']})"
                row_data[key] = r["value"]
            table_rows.append(row_data)

        # Growth analysis for common metrics
        growth_items = []
        for comp in companies:
            comp_df = df[df["company_name"] == comp]
            rev_entries = comp_df[comp_df["metric_name"].str.contains("Revenue", case=False, na=False)].sort_values("fiscal_year")
            if len(rev_entries) >= 2:
                earlier = rev_entries.iloc[0]["value"]
                later = rev_entries.iloc[-1]["value"]
                growth_pct = ((later - earlier) / earlier) * 100 if earlier > 0 else 0
                growth_items.append({
                    "company": comp,
                    "metric": "Revenue Growth",
                    "from_period": f"{rev_entries.iloc[0]['fiscal_quarter']} {rev_entries.iloc[0]['fiscal_year']}",
                    "to_period": f"{rev_entries.iloc[-1]['fiscal_quarter']} {rev_entries.iloc[-1]['fiscal_year']}",
                    "earlier_value": earlier,
                    "later_value": later,
                    "growth_pct": round(growth_pct, 2)
                })

        return {
            "companies": companies,
            "comparison_table": table_rows,
            "growth_analysis": growth_items,
            "total_metrics_evaluated": len(metrics)
        }
