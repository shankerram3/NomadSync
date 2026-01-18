#!/usr/bin/env python3
"""
NomadSync Development Startup Script (Python version)
Starts both backend (FastAPI) and frontend (Vite) servers
"""

import os
import sys
import subprocess
import signal
import time
import shutil
from pathlib import Path

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_info(msg):
    print(f"{Colors.BLUE}ℹ{Colors.NC} {msg}")

def print_success(msg):
    print(f"{Colors.GREEN}✓{Colors.NC} {msg}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠{Colors.NC} {msg}")

def print_error(msg):
    print(f"{Colors.RED}✗{Colors.NC} {msg}")

# Global process references
backend_process = None
frontend_process = None

def check_mongodb():
    """Check if MongoDB is running"""
    # Check if MongoDB is accessible
    try:
        import pymongo
        client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=1000)
        client.admin.command('ping')
        client.close()
        return True
    except:
        pass
    
    # Check if MongoDB Docker container is running
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "nomadsync-mongodb" in result.stdout:
            return True
    except:
        pass
    
    return False

def start_mongodb(project_root):
    """Start MongoDB using Docker Compose"""
    docker_compose_file = project_root / "docker-compose.yml"
    if docker_compose_file.exists():
        try:
            print_info("Starting MongoDB using Docker Compose...")
            result = subprocess.run(
                ["docker-compose", "up", "-d", "mongodb"],
                cwd=project_root,
                timeout=30
            )
            if result.returncode == 0:
                time.sleep(3)
                if check_mongodb():
                    print_success("MongoDB started in Docker container")
                    return True
        except FileNotFoundError:
            print_warning("docker-compose not found. Please install Docker Compose.")
        except subprocess.TimeoutExpired:
            print_error("Timeout starting MongoDB")
        except Exception as e:
            print_error(f"Error starting MongoDB: {e}")
    
    print_warning("MongoDB is not running. Please start it manually:")
    print_info("  docker-compose up -d mongodb")
    return False

def cleanup(signum=None, frame=None):
    """Cleanup function to stop all processes"""
    print_info("Shutting down servers...")
    if backend_process:
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
        print_info("Backend server stopped")
    
    if frontend_process:
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            frontend_process.kill()
        print_info("Frontend server stopped")
    
    # Note: MongoDB is not stopped by default to preserve data
    print_info("Note: MongoDB continues running (use 'docker-compose stop mongodb' to stop it)")
    
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    # Get project root directory
    project_root = Path(__file__).parent.absolute()
    os.chdir(project_root)
    
    print_success("Starting NomadSync development servers...")
    print()
    
    # Check and start MongoDB if needed
    if not check_mongodb():
        print_warning("MongoDB is not running")
        if not start_mongodb(project_root):
            print_error("Failed to start MongoDB. The backend may not work correctly.")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != 'y':
                return 1
    else:
        print_success("MongoDB is already running")
    print()
    
    # Check for Python virtual environment
    venv_paths = [
        project_root / "backend" / ".venv",
        project_root / ".venv"
    ]
    
    venv_activated = False
    for venv_path in venv_paths:
        if venv_path.exists():
            print_info(f"Found virtual environment at {venv_path}")
            # Note: In a real scenario, you'd activate this, but for subprocess we'll use the venv's python
            venv_activated = True
            break
    
    # Check/create backend .env file
    backend_env = project_root / "backend" / ".env"
    if not backend_env.exists():
        print_warning("backend/.env file not found. Creating from template...")
        import secrets
        jwt_secret = secrets.token_hex(32)
        env_content = f"""MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=nomadsync
JWT_SECRET={jwt_secret}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
"""
        backend_env.write_text(env_content)
        print_success("Created backend/.env file with default values")
    
    # Check if node_modules exists
    if not (project_root / "node_modules").exists():
        print_warning("node_modules not found. Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True)
    
    # Check if backend dependencies are installed
    try:
        import fastapi
    except ImportError:
        print_warning("Backend dependencies not found. Installing...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"],
            check=True
        )
    
    # Start backend server
    print_info("Starting backend server (FastAPI) on http://localhost:8000")
    backend_dir = project_root / "backend"
    
    # Use venv python if available
    python_cmd = sys.executable
    if venv_activated:
        for venv_path in venv_paths:
            venv_python = venv_path / "bin" / "python"
            if venv_python.exists():
                python_cmd = str(venv_python)
                break
    
    global backend_process
    backend_process = subprocess.Popen(
        [python_cmd, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=backend_dir,
        stdout=open(project_root / "backend.log", "w"),
        stderr=subprocess.STDOUT
    )
    
    time.sleep(2)
    
    if backend_process.poll() is None:
        print_success(f"Backend server started (PID: {backend_process.pid})")
    else:
        print_error("Backend server failed to start. Check backend.log for details.")
        return 1
    
    # Start frontend server
    print_info("Starting frontend server (Vite) on http://localhost:5173")
    global frontend_process
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=project_root,
        stdout=open(project_root / "frontend.log", "w"),
        stderr=subprocess.STDOUT
    )
    
    time.sleep(2)
    
    if frontend_process.poll() is None:
        print_success(f"Frontend server started (PID: {frontend_process.pid})")
    else:
        print_error("Frontend server failed to start. Check frontend.log for details.")
        cleanup()
        return 1
    
    print()
    print_success("Development servers are running!")
    print()
    print(f"{Colors.GREEN}MongoDB:{Colors.NC}       mongodb://localhost:27017")
    print(f"{Colors.GREEN}Backend API:{Colors.NC}  http://localhost:8000")
    print(f"{Colors.GREEN}Frontend App:{Colors.NC} http://localhost:5173")
    print(f"{Colors.GREEN}API Docs:{Colors.NC}     http://localhost:8000/docs")
    print()
    print_info("Press Ctrl+C to stop all servers")
    print_info("Note: MongoDB will continue running (use 'docker-compose stop mongodb' to stop it)")
    print()
    
    # Wait for processes
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        cleanup()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
