"""Configuration for the Interview Helper backend."""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent  # interview-helper/
SKILL_DIR = BASE_DIR  # interview-helper/ (contains data/, scripts/, references/, SKILL.md)
SCRIPTS_DIR = SKILL_DIR / "scripts"
DATA_DIR = SKILL_DIR / "data"
REFERENCES_DIR = SKILL_DIR / "references"

# Session and upload storage
SESSIONS_ROOT = BASE_DIR / "sessions"
UPLOADS_DIR = BASE_DIR / "uploads"

# Ensure directories exist
SESSIONS_ROOT.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Anthropic API configuration (DeepSeek endpoint)
ANTHROPIC_API_KEY = os.environ.get(
    "ANTHROPIC_AUTH_TOKEN",
    "sk-6397c0f9ee564435928af0b8052aaae2"
)
ANTHROPIC_BASE_URL = os.environ.get(
    "ANTHROPIC_BASE_URL",
    "https://api.deepseek.com/anthropic"
)
ANTHROPIC_MODEL = os.environ.get(
    "ANTHROPIC_MODEL",
    "deepseek-v4-pro[1m]"
)

# Load SKILL.md content once at startup
SKILL_MD_PATH = SKILL_DIR / "SKILL.md"
SKILL_MD_CONTENT = SKILL_MD_PATH.read_text(encoding="utf-8") if SKILL_MD_PATH.exists() else ""

# Server config
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
