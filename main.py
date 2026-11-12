"""Railway entry point — imports and runs the FastAPI app from backend/server.py"""
import sys
from pathlib import Path

# Add backend/ to the Python path so "server" module is importable
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from server import app