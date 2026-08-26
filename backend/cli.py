import subprocess
import sys
import uvicorn

def start_backend():
    """Runs the FastAPI backend with hot-reloading on port 8000."""
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

def start_tunnel():
    """Spawns Cloudflare Tunnel pointing to the local backend on port 8000."""
    try:
        subprocess.run(["cloudflared", "tunnel", "--url", "http://localhost:8000"])
    except FileNotFoundError:
        print("\n[ERROR] 'cloudflared' command not found.", file=sys.stderr)
        print("Please ensure Cloudflare Tunnel is installed and available on your PATH.", file=sys.stderr)
        print("Install via PowerShell: winget install --id Cloudflare.cloudflared -e\n", file=sys.stderr)
