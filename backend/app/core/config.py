import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR.parent / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
SAMPLE_DIR = DATA_DIR / "sample"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'cropguardian.db'}")
SECRET_KEY = os.getenv("JWT_SECRET", "cropguardian_hackathon_secret_key_2026")
WEATHER_PROVIDER = os.getenv("WEATHER_PROVIDER", "open-meteo")
DEBUG = True
