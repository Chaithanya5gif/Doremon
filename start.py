#!/usr/bin/env python3
"""
DORAEMON AI Companion - Startup Script
Run this script to start both the backend and frontend development server.

Usage:
    python start.py              # Start backend only (recommended)
    python start.py --dev        # Start backend with hot reload
    python start.py --frontend   # Start frontend dev server only
    python start.py --fullstack  # Start both backend and frontend
"""
import subprocess
import sys
import os
import argparse
import webbrowser
import time

def load_env():
    """Load environment variables from .env file"""
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()
        print("[DORAEMON] Loaded environment variables from .env")

# Load environment before anything else
load_env()

def start_backend(dev=False):
    """Start the FastAPI backend server."""
    print("=" * 60)
    print("  Starting DORAEMON Backend Server")
    print("=" * 60)

    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    port = os.environ.get("PORT", "8000")

    cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", port]
    if dev:
        cmd.append("--reload")

    print(f"Server will start at: http://localhost:{port}")
    print(f"API docs available at: http://localhost:{port}/docs")
    print("-" * 60)

    try:
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\n[DORAEMON] Backend server stopped.")


def start_frontend():
    """Start the frontend development server."""
    print("=" * 60)
    print("  Starting DORAEMON Frontend Dev Server")
    print("=" * 60)

    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")

    try:
        subprocess.run(["npm", "run", "dev"], cwd=frontend_dir)
    except KeyboardInterrupt:
        print("\n[DORAEMON] Frontend server stopped.")


def start_fullstack():
    """Start both backend and frontend."""
    import multiprocessing

    backend_process = multiprocessing.Process(target=start_backend, kwargs={"dev": True})
    backend_process.start()

    # Wait for backend to start
    time.sleep(2)

    # Open browser
    webbrowser.open("http://localhost:8000")

    try:
        backend_process.join()
    except KeyboardInterrupt:
        print("\n[DORAEMON] Fullstack servers stopped.")
        backend_process.terminate()


def main():
    parser = argparse.ArgumentParser(description="DORAEMON AI Companion Startup")
    parser.add_argument("--dev", action="store_true", help="Enable hot reload for backend")
    parser.add_argument("--frontend", action="store_true", help="Start frontend dev server only")
    parser.add_argument("--fullstack", action="store_true", help="Start both backend and frontend")
    args = parser.parse_args()

    if args.frontend:
        start_frontend()
    elif args.fullstack:
        start_fullstack()
    else:
        start_backend(dev=args.dev)


if __name__ == "__main__":
    main()
