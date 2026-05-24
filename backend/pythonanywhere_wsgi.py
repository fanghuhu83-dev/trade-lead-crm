# This file goes into PythonAnywhere's WSGI configuration.
# After uploading your code to /home/<username>/mysite/,
# paste this into the WSGI config file at the Web tab.
import sys
import os

# ─── CHANGE THIS to your PythonAnywhere username ───
PA_USERNAME = "YOUR_USERNAME"

project_home = f"/home/{PA_USERNAME}/mysite"
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Environment variables
os.environ.setdefault("AI_API_KEY", "sk-da70a0243ec04235babad6a4d4844aa9")
os.environ.setdefault("AI_MODEL", "deepseek-chat")
os.environ.setdefault("AI_BASE_URL", "https://api.deepseek.com")
os.environ.setdefault("JWT_SECRET", "trade-lead-prod-2024-secure")

from app import app as application
