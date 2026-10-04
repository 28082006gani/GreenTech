"""
AeroSync India - Application Launcher
Starts both the FastAPI Backend (port 8000) and the Vite Frontend (port 5173).
"""

import subprocess
import sys
import os
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    python_exe = os.path.join(backend_dir, ".venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    print("=" * 60)
    print("  🍃 AeroSync India: Coupled AQI Forecasting Platform")
    print("=" * 60)
    print("  Starting FastAPI backend on:  http://localhost:8000")
    print("  Starting React frontend on:   http://localhost:5173")
    print("  API Docs (Swagger UI):        http://localhost:8000/docs")
    print("=" * 60)

    # Launch Backend
    backend_cmd = [
        python_exe, "-m", "uvicorn", "backend.app.main:app",
        "--host", "0.0.0.0", "--port", "8000", "--reload"
    ]
    
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=root_dir,
        env=dict(os.environ, PYTHONPATH=root_dir)
    )

    # Launch Frontend
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping AeroSync India services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("Services stopped.")

if __name__ == "__main__":
    main()
