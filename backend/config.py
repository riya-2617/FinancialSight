import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

REPORTS_DIR = BASE_DIR / "generated_reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

SAMPLES_DIR = BASE_DIR / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

THUMBNAILS_DIR = UPLOAD_DIR / "thumbnails"
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

# Database URL - default to local SQLite, or PostgreSQL if DATABASE_URL is set
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'financialsight.db'}")

# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")

# Embedding and LLM models
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
DEFAULT_EMBED_MODEL = "text-embedding-004"

