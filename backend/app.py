from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import sqlite3
import ollama
import json
from datetime import datetime
import traceback
import math
import os

app = Flask(__name__)


CORS(app, resources={r"/api/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type"],
    "supports_credentials": False
}})


@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        return '', 204

DB_PATH = os.environ.get("DB_PATH", "energyw.db")


# ================================
# DATABASE INITIALIZATION
# ================================
def init_db():
    """Initialize database with reports table and migrate if needed"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Create reports table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            quarter TEXT,
            report_json TEXT NOT NULL,
            raw_text TEXT,
            metadata TEXT,
            text_content TEXT,
            stats_json TEXT,
            context_json TEXT
        )
    """)
    
    # Migration: Add missing columns if they don't exist
    # Get existing columns
    cur.execute("PRAGMA table_info(reports)")
    existing_columns = [row[1] for row in cur.fetchall()]
    
    # Add text_content if missing
    if 'text_content' not in existing_columns:
        cur.execute("ALTER TABLE reports ADD COLUMN text_content TEXT")
        print("Added column: text_content")
    
    # Add stats_json if missing
    if 'stats_json' not in existing_columns:
        cur.execute("ALTER TABLE reports ADD COLUMN stats_json TEXT")
        print("Added column: stats_json")
    
    # Add context_json if missing
    if 'context_json' not in existing_columns:
        cur.execute("ALTER TABLE reports ADD COLUMN context_json TEXT")
        print("Added column: context_json")

    conn.commit()
    conn.close()
    print(f"Database initialized at: {os.path.abspath(DB_PATH)}")


# ================================
# DATA LOADING
# ================================
def load_data():
    """Load metrics data from database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query("SELECT * FROM upstream_metrics", conn)
        conn.close()

        if df.empty:
            print("WARNING: DataFrame is empty!")
            return pd.DataFrame()

        # Ensure Date is datetime (handle mixed formats)
        df["Date"] = pd.to_datetime(df["Date"], format='mixed', errors='coerce')
        df["Quarter"] = df["Date"].dt.quarter

        print(f"Loaded {len(df)} records from database")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        traceback.print_exc()
        return pd.DataFrame()

# ================================
# FILTERING
# ================================
def filter_by_quarter(df, quarter):
    """Filter dataframe by quarter"""
    if not quarter or quarter == "":
        return df

    try:
        q = int(quarter)
        if q in (1, 2, 3, 4):
            filtered = df[df["Quarter"] == q]
            return filtered
    except Exception:
        pass

    return df


def filter_data(df, filters):
    """Apply multiple filters to dataframe"""
    if not filters:
        return df

    if filters.get("department"):
        df = df[df["Department"] == filters["department"]]

    if filters.get("stream"):
        df = df[df["Stream"] == filters["stream"]]

    if filters.get("adminArea"):
        df = df[df["AdminArea"] == filters["adminArea"]]

    if filters.get("quarter"):
        df = filter_by_quarter(df, filters["quarter"])

    return df


# ================================
# SUMMARY BUILDER FOR AI
# ================================
def build_summary(df):
    """Build comprehensive summary for AI analysis based on current schema"""
    if df.empty:
        return {
            "error": "No data available",
            "records_count": 0
        }

    summary = {
        "records_count": len(df),
        "date_range": {
            "start": df["Date"].min().strftime("%Y-%m-%d"),
            "end": df["Date"].max().strftime("%Y-%m-%d")
        }
    }

    # Production metrics (Upstream)
    if "Production_Actual" in df.columns and "Production_Target" in df.columns:
        total_target = float(df["Production_Target"].fillna(0).sum())
        total_actual = float(df["Production_Actual"].fillna(0).sum())

        summary["production"] = {
            "total_actual": total_actual,
            "total_target": total_target,
            "avg_actual": float(df["Production_Actual"].mean()),
            "avg_target": float(df["Production_Target"].mean()),
            "achievement_rate": float((total_actual / total_target * 100) if total_target > 0 else 0)
        }

    # Throughput metrics (Midstream)
    if "Throughput_Actual" in df.columns and "Throughput_Target" in df.columns:
        total_target = float(df["Throughput_Target"].fillna(0).sum())
        total_actual = float(df["Throughput_Actual"].fillna(0).sum())

        summary["throughput"] = {
            "total_actual": total_actual,
            "total_target": total_target,
            "avg_actual": float(df["Throughput_Actual"].mean()),
            "avg_target": float(df["Throughput_Target"].mean()),
            "utilization_rate": float((total_actual / total_target * 100) if total_target > 0 else 0)
        }

    # Compression metrics (Midstream)
    if "Compression_Actual" in df.columns and "Compression_Target" in df.columns:
        summary["compression"] = {
            "avg_actual": float(df["Compression_Actual"].mean()),
            "avg_target": float(df["Compression_Target"].mean())
        }

    # Processing metrics (Midstream)
    if "Processing_Actual" in df.columns and "Processing_Target" in df.columns:
        total_target = float(df["Processing_Target"].fillna(0).sum())
        total_actual = float(df["Processing_Actual"].fillna(0).sum())

        summary["processing"] = {
            "total_actual": total_actual,
            "total_target": total_target,
            "avg_actual": float(df["Processing_Actual"].mean()),
            "avg_target": float(df["Processing_Target"].mean())
        }

    # Refining metrics (Downstream)
    if "Refinery_Actual" in df.columns and "Refinery_Target" in df.columns:
        total_target = float(df["Refinery_Target"].fillna(0).sum())
        total_actual = float(df["Refinery_Actual"].fillna(0).sum())

        summary["refining"] = {
            "total_actual": total_actual,
            "total_target": total_target,
            "avg_actual": float(df["Refinery_Actual"].mean()),
            "avg_target": float(df["Refinery_Target"].mean())
        }

    # Yield metrics (Downstream)
    if "Yield_Actual" in df.columns and "Yield_Target" in df.columns:
        summary["yield"] = {
            "avg_actual": float(df["Yield_Actual"].mean()),
            "avg_target": float(df["Yield_Target"].mean())
        }

    # Energy metrics (shared)
    if "Energy_Actual" in df.columns:
        summary["energy"] = {
            "total_actual": float(df["Energy_Actual"].sum()),
            "avg_actual": float(df["Energy_Actual"].mean())
        }

    # Downtime metrics
    if "Downtime_Min" in df.columns:
        summary["downtime"] = {
            "total_downtime_min": int(df["Downtime_Min"].sum()),
            "avg_downtime_min": float(df["Downtime_Min"].mean()),
            "high_downtime_events": int(df[df["Downtime_Min"] >= 60].shape[0])
        }

    # Organizational breakdown
    if "AdminArea" in df.columns:
        summary["admin_areas"] = {
            "count": int(df["AdminArea"].nunique()),
            "list": df["AdminArea"].unique().tolist()
        }

    if "Department" in df.columns:
        summary["departments"] = {
            "count": int(df["Department"].nunique()),
            "list": df["Department"].unique().tolist()
        }

    if "Stream" in df.columns:
        summary["streams"] = {
            "count": int(df["Stream"].nunique()),
            "list": df["Stream"].unique().tolist()[:10]  # top 10 for context
        }

    # Performance based on production variance if available
    if "Production_Actual" in df.columns and "Production_Target" in df.columns:
        tmp = df.copy()
        tmp = tmp[tmp["Production_Target"] > 0].copy()

        if not tmp.empty:
            tmp["Prod_Variance_pct"] = (tmp["Production_Actual"] - tmp["Production_Target"]) / tmp["Production_Target"] * 100.0

            top_performers = tmp.nlargest(5, "Prod_Variance_pct")[["Stream", "Prod_Variance_pct"]].to_dict("records")
            underperformers = tmp.nsmallest(5, "Prod_Variance_pct")[["Stream", "Prod_Variance_pct"]].to_dict("records")

            summary["production_performance"] = {
                "top_5": [
                    {
                        "stream": r["Stream"],
                        "variance_pct": float(r["Prod_Variance_pct"])
                    }
                    for r in top_performers
                ],
                "bottom_5": [
                    {
                        "stream": r["Stream"],
                        "variance_pct": float(r["Prod_Variance_pct"])
                    }
                    for r in underperformers
                ]
            }

    return summary


# ================================
# HELPER FUNCTIONS
# ================================
def clean_json_record(record):
    """Clean NaN and inf values from record for JSON serialization"""
    clean = {}
    for k, v in record.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            clean[k] = None
        elif pd.isna(v):  # Handle NaN for other types
            clean[k] = None
        else:
            clean[k] = v
    return clean


# ================================
# API ENDPOINTS
# ================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "Aramco Operations API",
        "timestamp": datetime.now().isoformat(),
        "database": os.path.exists(DB_PATH)
    })


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Get all metrics with optional filters"""
    try:
        quarter = request.args.get("quarter")
        department = request.args.get("department")
        admin_area = request.args.get("adminArea")
        stream = request.args.get("stream")

        print(f"\n=== GET /api/metrics ===")
        print(f"Parameters: quarter={quarter}, department={department}, adminArea={admin_area}, stream={stream}")

        df = load_data()

        if df.empty:
            print("ERROR: DataFrame is empty after loading")
            return jsonify({
                "status": "error",
                "message": "No data available in database",
                "records": []
            }), 404

        # Apply filters
        filters = {}
        if quarter:
            filters["quarter"] = quarter
        if department:
            filters["department"] = department
        if admin_area:
            filters["adminArea"] = admin_area
        if stream:
            filters["stream"] = stream

        if filters:
            df = filter_data(df, filters)

        # Check if data exists after filtering
        if df.empty:
            print("WARNING: No data after filtering")
            return jsonify({
                "status": "ok",  # Changed from "error" to "ok"
                "message": "No data matches the selected filters",
                "records": [],
                "count": 0,
                "filters": filters
            })

        # Convert date to string
        df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

        # Convert NaN → None (JSON-safe)
        records = df.to_dict(orient="records")
        records = [clean_json_record(r) for r in records]

        print(f"Returning {len(records)} records")
        return jsonify({
            "status": "ok",
            "records": records,
            "count": len(records),
            "filters": filters
        })

    except Exception as e:
        print(f"Error in /api/metrics: {e}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e),
            "records": []
        }), 500


@app.route("/api/summary", methods=["GET"])
def get_summary():
    """Get summary statistics"""
    try:
        quarter = request.args.get("quarter")
        department = request.args.get("department")
        admin_area = request.args.get("adminArea")
        stream = request.args.get("stream")

        df = load_data()

        if df.empty:
            return jsonify({
                "status": "error",
                "message": "No data available"
            }), 404

        # Apply filters
        filters = {}
        if quarter:
            filters["quarter"] = quarter
        if department:
            filters["department"] = department
        if admin_area:
            filters["adminArea"] = admin_area
        if stream:
            filters["stream"] = stream

        if filters:
            df = filter_data(df, filters)

        # Build period label
        period_label = "Full Year 2024"
        if quarter:
            period_label = f"Q{quarter} 2024"

        if department:
            period_label += f" - {department}"
        if admin_area:
            period_label += f" - {admin_area}"
        if stream:
            period_label += f" - Stream {stream}"

        summary = build_summary(df)
        summary["period_label"] = period_label

        return jsonify({
            "status": "ok",
            "summary": summary
        })

    except Exception as e:
        print(f"Error in /api/summary: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/report", methods=["POST"])
def generate_report():
    """Generate AI-powered report using Ollama"""
    try:
        payload = request.get_json() or {}
        quarter = payload.get("quarter")
        department = payload.get("department")
        admin_area = payload.get("adminArea")
        stream = payload.get("stream")

        print(f"Generating report for quarter={quarter}, department={department}, adminArea={admin_area}, stream={stream}")

        df = load_data()

        if df.empty:
            return jsonify({
                "status": "error",
                "message": "No data available for report generation"
            }), 404

        # Apply filters
        filters = {}
        if quarter:
            filters["quarter"] = quarter
        if department:
            filters["department"] = department
        if admin_area:
            filters["adminArea"] = admin_area
        if stream:
            filters["stream"] = stream

        df_filtered = filter_data(df, filters) if filters else df

        if df_filtered.empty:
            return jsonify({
                "status": "error",
                "message": "No data matches the selected filters"
            }), 404

        # Build summary
        summary = build_summary(df_filtered)

        # Determine period label
        if quarter:
            period_label = f"Q{quarter} 2024"
        else:
            period_label = "Full Year 2024"

        if department:
            period_label += f" - {department}"
        if admin_area:
            period_label += f" - {admin_area}"
        if stream:
            period_label += f" - Stream {stream}"

        summary["period_label"] = period_label

        # Create AI prompt
        prompt = f"""You are a senior operations analyst for an integrated oil and gas company (upstream, midstream, downstream).

Generate a comprehensive operational report based on the following data.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON (no markdown, no code blocks, no backticks).
2. All values must be strings (use "\\n" for line breaks in text).
3. Do not use arrays or nested objects.
4. Be specific, analytical, and data-driven.
5. Base everything strictly on the provided metrics.

CRITICAL - PERCENTAGE INTERPRETATION RULES:
- Achievement rate of 102.40% means: Actual = 102.40% OF Target, so actual exceeded target by only 2.40%
- Achievement rate of 98.50% means: Actual = 98.50% OF Target, so actual is 1.50% BELOW target
- Utilization rate of 101.13% means: we achieved 1.13% MORE than target
- CORRECT phrasing: "exceeded target by 2.40%" or "1.13% above target" or "achieved 102% of target"
- WRONG phrasing: "increased by 102%" or "utilization stood at 101.13%" (this is misleading)
- Always calculate: (Achievement% - 100%) = actual variance from target
- Example: 103.08% achievement = 3.08% above target, NOT 103% increase

JSON Structure Required:
{{
    "executive_summary": "string with detailed summary",
    "key_insights": "string with bullet points using \\n- format",
    "anomalies": "string describing issues and concerns",
    "recommendations": "string with actionable recommendations"
}}

Reporting Period: {period_label}

Metrics Summary:
{json.dumps(summary, indent=2)}

Analysis Requirements:
- Compare actual vs target performance across upstream, midstream, and downstream metrics where available.
- Identify efficiency trends and potential bottlenecks by admin area, department, and stream.
- Highlight underperforming operational areas and streams.
- Assess energy usage and downtime patterns.
- Provide root cause analysis where possible based on the metrics.
- Give specific, actionable operational recommendations.

Generate the report now in pure JSON format:
"""

        print("Calling Ollama AI...")

        # Call Ollama
        response = ollama.chat(
            model="llama3.1",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert petroleum engineer and data analyst. Return only valid JSON with no markdown formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        raw_response = response["message"]["content"]
        print("Raw Ollama Response (truncated):")
        print(raw_response[:500])

        # Clean response
        raw_response = raw_response.strip()
        raw_response = raw_response.replace("```json", "").replace("```", "")

        # Parse JSON - with enhanced cleaning for newlines in strings
        try:
            # Fix newlines inside JSON string values
            import re
            
            def fix_json_newlines(json_str):
                # This regex finds content between quotes and replaces actual newlines with \n
                result = []
                in_string = False
                escape_next = False
                
                for i, char in enumerate(json_str):
                    if escape_next:
                        result.append(char)
                        escape_next = False
                        continue
                        
                    if char == '\\':
                        escape_next = True
                        result.append(char)
                        continue
                        
                    if char == '"' and not escape_next:
                        in_string = not in_string
                        result.append(char)
                        continue
                    
                    if in_string and char == '\n':
                        result.append('\\n')
                    elif in_string and char == '\r':
                        result.append('\\r')
                    elif in_string and char == '\t':
                        result.append('\\t')
                    else:
                        result.append(char)
                
                return ''.join(result)
            
            cleaned_response = fix_json_newlines(raw_response)
            report_data = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            print(f"Raw response: {raw_response}")
            return jsonify({
                "status": "error",
                "message": "AI generated invalid JSON format",
                "raw_response": raw_response
            }), 500

        # Validate structure
        required_fields = ["executive_summary", "key_insights", "anomalies", "recommendations"]
        for field in required_fields:
            if field not in report_data:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 500

        # Save to database
        now = datetime.now().isoformat()

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        metadata = {
            "filters": filters,
            "summary": summary,
            "generated_at": now
        }

        cur.execute("""
            INSERT INTO reports (created_at, updated_at, quarter, report_json, raw_text, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            now,
            now,
            quarter or "all",
            json.dumps(report_data),
            raw_response,
            json.dumps(metadata)
        ))

        report_id = cur.lastrowid
        conn.commit()
        conn.close()

        print(f"Report saved with ID: {report_id}")

        return jsonify({
            "status": "ok",
            "report_id": report_id,
            "report": report_data,
            "metadata": {
                "period": period_label,
                "records_analyzed": len(df_filtered),
                "generated_at": now
            }
        })

    except Exception as e:
        print(f"Error generating report: {e}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/save-report", methods=["POST"])
def save_report_to_db():
    """Save complete report with text content, stats, and context to database"""
    try:
        payload = request.get_json() or {}
        
        text_content = payload.get("textContent", {})
        stats = payload.get("stats", {})
        context = payload.get("context", {})
        quarter = payload.get("quarter")
        department = payload.get("department")
        
        if not text_content or len(text_content) == 0:
            return jsonify({
                "status": "error",
                "message": "No report text content provided"
            }), 400
        
        now = datetime.now().isoformat()
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        metadata = {
            "department": department,
            "saved_at": now
        }
        
        # Save all components separately for easy retrieval
        cur.execute("""
            INSERT INTO reports (created_at, updated_at, quarter, text_content, stats_json, context_json, metadata, report_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now,
            now,
            quarter or "all",
            json.dumps(text_content),
            json.dumps(stats),
            json.dumps(context),
            json.dumps(metadata),
            json.dumps({
                "textContent": text_content,
                "stats": stats,
                "context": context
            })
        ))
        
        report_id = cur.lastrowid
        conn.commit()
        conn.close()
        
        print(f"Report saved to database with ID: {report_id}")
        
        return jsonify({
            "status": "ok",
            "report_id": report_id,
            "message": "Report saved successfully to database"
        })
    
    except Exception as e:
        print(f"Error saving report: {e}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/rewrite", methods=["POST", "OPTIONS"])
def rewrite_text():
    """AI-powered text rewriting using Ollama"""
    
    # Handle preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        payload = request.get_json() or {}
        original_text = payload.get("text", "").strip()
        instructions = payload.get("instructions", "Rewrite clearly and professionally.").strip()

        if not original_text:
            return jsonify({
                "status": "error",
                "message": "No text provided for rewriting"
            }), 400

        print(f"\n=== Text Rewrite Request ===")
        print(f"Original length: {len(original_text)} chars")
        print(f"Instructions: {instructions[:100]}...")

        # Create prompt for Ollama
        prompt = f"""You are a professional business report editor. Your task is to rewrite the following text according to the user's specific instructions.

CRITICAL RULES:
1. Keep the core meaning and all factual information
2. Maintain technical and domain terminology
3. Return ONLY the rewritten text (no explanations, no "Here's the rewritten text:", no markdown)
4. Do not add new information not in the original
5. Preserve all numbers and metrics

User Instructions: {instructions}

Original Text:
{original_text}

Rewritten Text:"""

        # Call Ollama
        response = ollama.chat(
            model="llama3.1",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert business writer. Rewrite text according to user instructions. Return ONLY the rewritten text without any explanation or preamble."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            stream=False
        )

        rewritten_text = response["message"]["content"].strip()

        # Clean up common Ollama artifacts
        rewritten_text = rewritten_text.replace("```", "").strip()
        if rewritten_text.startswith("Rewritten Text:"):
            rewritten_text = rewritten_text.replace("Rewritten Text:", "").strip()

        print(f"Rewritten length: {len(rewritten_text)} chars")

        return jsonify({
            "status": "ok",
            "rewritten": rewritten_text,
            "original_length": len(original_text),
            "rewritten_length": len(rewritten_text)
        })

    except Exception as e:
        print(f"Error in /api/rewrite: {e}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/reports", methods=["GET"])
def list_reports():
    """List all saved reports"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
            SELECT id, created_at, updated_at, quarter, metadata, text_content, context_json
            FROM reports
            ORDER BY id DESC
        """)

        rows = cur.fetchall()
        conn.close()

        reports = []
        for row in rows:
            metadata = json.loads(row[4]) if row[4] else {}
            text_content = json.loads(row[5]) if row[5] else {}
            context = json.loads(row[6]) if row[6] else {}
            
            # Extract first line of executive summary for preview
            preview = text_content.get("executive_summary", "")[:150] if text_content else ""
            
            # Get report name from context
            report_name = context.get("reportName", "") or metadata.get("reportName", "")
            
            reports.append({
                "id": row[0],
                "created_at": row[1],
                "updated_at": row[2],
                "quarter": row[3],
                "metadata": metadata,
                "preview": preview,
                "name": report_name,
                "context": context
            })

        return jsonify({
            "status": "ok",
            "reports": reports,
            "count": len(reports)
        })

    except Exception as e:
        print(f"Error listing reports: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/reports/<int:report_id>", methods=["GET"])
def get_report(report_id):
    """Get a specific report with all details"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
            SELECT id, created_at, updated_at, quarter, report_json, raw_text, metadata, text_content, stats_json, context_json
            FROM reports
            WHERE id = ?
        """, (report_id,))

        row = cur.fetchone()
        conn.close()

        if not row:
            return jsonify({
                "status": "error",
                "message": "Report not found"
            }), 404

        # Try to get data from new format first
        text_content = json.loads(row[7]) if row[7] else None
        stats = json.loads(row[8]) if row[8] else None
        context = json.loads(row[9]) if row[9] else None
        report_data = json.loads(row[4]) if row[4] else {}
        metadata = json.loads(row[6]) if row[6] else {}
        
        # Fallback to old format if new format not available
        if not text_content and report_data:
            text_content = report_data.get("textContent") or report_data
        
        if not stats and report_data:
            stats = report_data.get("stats", {})
        
        if not context and report_data:
            context = report_data.get("context", {})

        return jsonify({
            "status": "ok",
            "report": {
                "id": row[0],
                "created_at": row[1],
                "updated_at": row[2],
                "quarter": row[3],
                "textContent": text_content or {},
                "stats": stats or {},
                "context": context or {},
                "metadata": metadata
            }
        })

    except Exception as e:
        print(f"Error getting report: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/data-range', methods=['POST'])
def get_data_range():
    """Get data by date range"""
    try:
        data = request.json or {}
        start_date = data.get('startDate')
        end_date = data.get('endDate')

        if not start_date or not end_date:
            return jsonify({
                "status": "error",
                "message": "startDate and endDate are required"
            }), 400

        df = load_data()

        if df.empty:
            return jsonify({
                "status": "error",
                "message": "No data available",
                "data": [],
                "count": 0
            }), 404

        # Filter by date range
        df_filtered = df[(df["Date"] >= start_date) & (df["Date"] <= end_date)]

        # Convert date to string for JSON
        df_filtered["Date"] = df_filtered["Date"].dt.strftime("%Y-%m-%d")

        # Clean NaN values
        records = df_filtered.to_dict(orient="records")
        records = [clean_json_record(r) for r in records]

        return jsonify({
            "status": "ok",
            "data": records,
            "count": len(records)
        })

    except Exception as e:
        print(f"Error in /api/data-range: {e}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e),
            "data": [],
            "count": 0
        }), 500


@app.route("/api/reports/<int:report_id>", methods=["DELETE"])
def delete_report(report_id):
    """Delete a report"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("DELETE FROM reports WHERE id = ?", (report_id,))

        if cur.rowcount == 0:
            conn.close()
            return jsonify({
                "status": "error",
                "message": "Report not found"
            }), 404

        conn.commit()
        conn.close()

        return jsonify({
            "status": "ok",
            "message": "Report deleted successfully"
        })

    except Exception as e:
        print(f"Error deleting report: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/reports/<int:report_id>", methods=["PUT"])
def update_report(report_id):
    """Update a report"""
    try:
        payload = request.get_json() or {}
        raw_text = payload.get("raw_text")
        text_content = payload.get("text_content")
        stats = payload.get("stats")
        context = payload.get("context")

        now = datetime.now().isoformat()

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
            UPDATE reports
            SET raw_text = ?, text_content = ?, stats_json = ?, context_json = ?, updated_at = ?
            WHERE id = ?
        """, (
            raw_text,
            json.dumps(text_content) if text_content else None,
            json.dumps(stats) if stats else None,
            json.dumps(context) if context else None,
            now,
            report_id
        ))

        if cur.rowcount == 0:
            conn.close()
            return jsonify({
                "status": "error",
                "message": "Report not found"
            }), 404

        conn.commit()
        conn.close()

        return jsonify({
            "status": "ok",
            "message": "Report updated successfully"
        })

    except Exception as e:
        print(f"Error updating report: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ================================
# UPDATE / DELETE / ADD METRICS
# ================================

@app.route("/api/metrics/<int:record_id>", methods=["PUT"])
def update_metric(record_id):
    """Update single metric record"""
    try:
        payload = request.get_json() or {}

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        # Build dynamic SET clause
        set_clause = ", ".join([f"{k} = ?" for k in payload.keys()])
        values = list(payload.values())
        values.append(record_id)

        cur.execute(f"UPDATE upstream_metrics SET {set_clause} WHERE id = ?", values)

        if cur.rowcount == 0:
            conn.close()
            return jsonify({"status": "error", "message": "Record not found"}), 404

        conn.commit()
        conn.close()

        return jsonify({"status": "ok", "message": "Record updated successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/metrics/<int:record_id>", methods=["DELETE"])
def delete_metric(record_id):
    """Delete a metric record"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("DELETE FROM upstream_metrics WHERE id = ?", (record_id,))

        if cur.rowcount == 0:
            conn.close()
            return jsonify({"status": "error", "message": "Record not found"}), 404

        conn.commit()
        conn.close()

        return jsonify({"status": "ok", "message": "Record deleted successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/metrics", methods=["POST"])
def add_metric():
    """Insert new metric record"""
    try:
        payload = request.get_json() or {}

        columns = ", ".join(payload.keys())
        placeholders = ", ".join(["?" for _ in payload.keys()])
        values = list(payload.values())

        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute(
            f"INSERT INTO upstream_metrics ({columns}) VALUES ({placeholders})",
            values
        )

        new_id = cur.lastrowid
        conn.commit()
        conn.close()

        return jsonify({"status": "ok", "id": new_id, "message": "Record added successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ================================
# DEBUG ENDPOINTS
# ================================

@app.route("/api/debug", methods=["GET"])
def debug_info():
    """Debug endpoint to check database status"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        # Check tables
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cur.fetchall()

        # Check upstream_metrics columns and count
        columns = []
        row_count = 0
        sample = None
        col_names = []
        if ('upstream_metrics',) in tables:
            cur.execute("PRAGMA table_info(upstream_metrics)")
            columns = cur.fetchall()
            cur.execute("SELECT COUNT(*) FROM upstream_metrics")
            row_count = cur.fetchone()[0]

            # Get sample data
            cur.execute("SELECT * FROM upstream_metrics LIMIT 1")
            sample_data = cur.fetchone()
            if sample_data:
                col_names = [description[0] for description in cur.description]
                sample = dict(zip(col_names, sample_data))

        conn.close()

        return jsonify({
            "status": "ok",
            "database_exists": os.path.exists(DB_PATH),
            "database_path": os.path.abspath(DB_PATH),
            "tables": tables,
            "upstream_metrics": {
                "exists": ('upstream_metrics',) in tables,
                "row_count": row_count,
                "columns": [col[1] for col in columns],
                "sample": sample
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/test", methods=["GET"])
def test_endpoint():
    """Test endpoint to verify data loading"""
    try:
        df = load_data()
        return jsonify({
            "status": "ok",
            "data_loaded": not df.empty,
            "record_count": len(df),
            "columns": df.columns.tolist() if not df.empty else []
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500
@app.route("/api/metrics/update-by-key", methods=["PUT"])
def update_metric_by_key():
    """Update metric record by composite key (Date + Stream + Department + AdminArea)"""
    try:
        payload = request.get_json() or {}
        
        # Get original identifying fields
        original_date = payload.pop('original_Date', None)
        original_stream = payload.pop('original_Stream', None)
        original_department = payload.pop('original_Department', None)
        original_admin_area = payload.pop('original_AdminArea', None)
        
        if not all([original_date, original_stream, original_department]):
            return jsonify({
                "status": "error",
                "message": "Missing required fields: original_Date, original_Stream, original_Department"
            }), 400
        
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        # Build dynamic SET clause from remaining payload
        set_clause = ", ".join([f"{k} = ?" for k in payload.keys()])
        values = list(payload.values())
        
        # Add WHERE clause values
        values.extend([original_date, original_stream, original_department])
        
        where_clause = "Date = ? AND Stream = ? AND Department = ?"
        if original_admin_area:
            where_clause += " AND AdminArea = ?"
            values.append(original_admin_area)
        
        sql = f"UPDATE upstream_metrics SET {set_clause} WHERE {where_clause}"
        print(f"SQL: {sql}")
        print(f"Values: {values}")
        
        cur.execute(sql, values)
        
        if cur.rowcount == 0:
            conn.close()
            return jsonify({
                "status": "error", 
                "message": "Record not found with given key"
            }), 404
        
        # Get the updated record's ID
        cur.execute("""
            SELECT id FROM upstream_metrics 
            WHERE Date = ? AND Stream = ? AND Department = ?
            LIMIT 1
        """, (payload.get('Date', original_date), 
              payload.get('Stream', original_stream), 
              payload.get('Department', original_department)))
        
        row = cur.fetchone()
        record_id = row[0] if row else None
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "ok", 
            "message": "Record updated successfully",
            "id": record_id,
            "rows_affected": cur.rowcount
        })
        
    except Exception as e:
        print(f"Error updating by key: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

# ================================
# STARTUP
# ================================
if __name__ == "__main__":
    print("=" * 60)
    print("Starting Operations API")
    print("=" * 60)

    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"WARNING: Database file '{DB_PATH}' not found at: {os.path.abspath('.')}")
        print("Creating empty database...")

    # Initialize database
    init_db()

    # Load initial data
    df_init = load_data()
    print(f"Total records available: {len(df_init)}")

    if not df_init.empty:
        print(f"Date range: {df_init['Date'].min()} to {df_init['Date'].max()}")
        if "Department" in df_init.columns:
            print(f"Departments: {df_init['Department'].nunique()}")
        if "AdminArea" in df_init.columns:
            print(f"Admin Areas: {df_init['AdminArea'].nunique()}")

    print("=" * 60)
    print("API Server Ready")
    print("Listening on: http://0.0.0.0:8001")
    print("Test endpoints:")
    print("  - GET /api/health")
    print("  - GET /api/debug")
    print("  - GET /api/test")
    print("  - GET /api/metrics")
    print("  - POST /api/rewrite")
    print("  - POST /api/save-report (NEW)")
    print("=" * 60)

    port = int(os.environ.get("PORT", 8001))
    app.run(host="0.0.0.0", port=port, debug=False)
