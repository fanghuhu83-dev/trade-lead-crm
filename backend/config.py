from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

DATA_DIR = BASE_DIR / 'data'
DATABASE_PATH = DATA_DIR / 'app.db'

ALLOWED_STATUSES = ['potential', 'contacted', 'following', 'won', 'lost']

STATUS_LABELS = {
    'potential': '潜在客户',
    'contacted': '已联系',
    'following': '跟进中',
    'won': '已成交',
    'lost': '无效客户',
}

AI_API_KEY = os.getenv('AI_API_KEY', os.getenv('OPENAI_API_KEY', ''))
AI_MODEL = os.getenv('AI_MODEL', 'deepseek-chat')
AI_BASE_URL = os.getenv('AI_BASE_URL', 'https://api.deepseek.com')

JWT_SECRET = os.getenv('JWT_SECRET', 'trade-lead-dev-secret-change-in-production')
JWT_EXPIRY_HOURS = int(os.getenv('JWT_EXPIRY_HOURS', '72'))
