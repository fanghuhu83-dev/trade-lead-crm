#!/bin/bash
# ===== Trade Lead System - PythonAnywhere Auto Setup =====
# Paste the entire content into: Consoles -> Bash
# Then press Enter. Everything happens automatically.

set -e

echo "========================================"
echo " Trade Lead System - Auto Setup"
echo "========================================"
echo ""

# Step 1: Create virtualenv
echo "[1/5] Creating Python virtual environment..."
python3 -m venv /home/fanghuhu/.virtualenvs/trade-lead 2>/dev/null || python -m venv /home/fanghuhu/.virtualenvs/trade-lead

# Step 2: Install dependencies
echo "[2/5] Installing Python packages..."
source /home/fanghuhu/.virtualenvs/trade-lead/bin/activate
pip install -r /home/fanghuhu/mysite/backend/requirements.txt

# Step 3: Create data directory
echo "[3/5] Setting up database..."
mkdir -p /home/fanghuhu/mysite/backend/data

# Step 4: Seed database
echo "[4/5] Seeding demo data..."
cd /home/fanghuhu/mysite/backend
FLASK_APP=app.py flask seed

# Step 5: Print WSGI config
echo "[5/5] Setup complete!"
echo ""
echo "========================================"
echo " NEXT STEPS:"
echo "========================================"
echo ""
echo "1. Go to Web tab, set Virtualenv to:"
echo "   /home/fanghuhu/.virtualenvs/trade-lead"
echo ""
echo "2. Open WSGI config file and REPLACE"
echo "   all content with the code below:"
echo ""
echo ">>>>>>>>>> PASTE THIS >>>>>>>>>>"
cat << 'WSGIEOF'
import sys
import os

PA_USERNAME = "fanghuhu"
project_home = f"/home/{PA_USERNAME}/mysite"
backend_dir = f"/home/{PA_USERNAME}/mysite/backend"
for p in [project_home, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ.setdefault("AI_API_KEY", "sk-da70a0243ec04235babad6a4d4844aa9")
os.environ.setdefault("AI_MODEL", "deepseek-chat")
os.environ.setdefault("AI_BASE_URL", "https://api.deepseek.com")
os.environ.setdefault("JWT_SECRET", "trade-lead-prod-2024-secure")

from app import app as application
WSGIEOF
echo ""
echo "<<<<<<<<<< END OF WSGI <<<<<<<<<<"
echo ""
echo "3. Click green RELOAD button"
echo "4. Visit https://fanghuhu.pythonanywhere.com/api/health"
echo ""
echo "Done!"
