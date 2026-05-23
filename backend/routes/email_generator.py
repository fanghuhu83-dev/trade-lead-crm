from flask import Blueprint, jsonify, request
from openai import OpenAI
from config import AI_API_KEY, AI_MODEL, AI_BASE_URL
from middleware import login_required

email_gen_bp = Blueprint("email_gen", __name__)

STYLE_PROMPTS = {
    "concise": "Write a brief, punchy cold email. Use 3-4 short paragraphs maximum. Get straight to the point — no fluff. Professional but friendly tone.",
    "formal": "Write a formal business development email. Use proper salutation and closing, structured paragraphs, and formal language. Sound polished and executive-level.",
    "marketing": "Write a persuasive, benefit-driven sales email. Lead with a compelling hook, highlight key value propositions with brief bullet-style points (using dashes), and end with a clear call to action. Sound enthusiastic but credible.",
}

ALLOWED_STYLES = list(STYLE_PROMPTS.keys())

BASE_SYSTEM_PROMPT = """You are an expert B2B foreign-trade sales copywriter. 
Your task is to write cold outreach emails in English for a Chinese exporter reaching out to overseas buyers.

IMPORTANT RULES:
- Write ONLY the email body. Do NOT write a subject line.
- Do NOT include placeholder brackets like [Name] or [Company]. Use generic salutation.
- Use the sender's company as "we" — the Chinese exporter.
- Keep the email natural, warm, and human — not robotic or template-like.
- Never mention that you are AI or that the email was generated.
- Sign off with a realistic sender name and title."""


@email_gen_bp.post("")
@login_required
def generate_email():
    payload = request.get_json(silent=True) or {}
    company_name = (payload.get("companyName") or "").strip()
    product_name = (payload.get("productName") or "").strip()
    country = (payload.get("country") or "").strip()
    industry = (payload.get("industry") or "").strip()
    style = (payload.get("style") or "concise").strip()

    errors = {}
    if not company_name:
        errors["companyName"] = "Company name is required."
    if not product_name:
        errors["productName"] = "Product name is required."
    if style not in ALLOWED_STYLES:
        errors["style"] = f"Invalid style. Allowed: {', '.join(ALLOWED_STYLES)}."
    if errors:
        return jsonify({"error": "Validation failed.", "fields": errors}), 400
    if not AI_API_KEY:
        return jsonify({"error": "AI API key is not configured. Set AI_API_KEY in .env"}), 500

    user_prompt = f"""Please generate a {style} cold outreach email:

- Company (recipient): {company_name}
- Product: {product_name}
- Country: {country or 'N/A'}
- Industry: {industry or 'N/A'}

Style: {STYLE_PROMPTS[style]}"""

    try:
        client = OpenAI(api_key=AI_API_KEY, base_url=AI_BASE_URL)
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": BASE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.8,
            max_tokens=800,
        )
        email_body = response.choices[0].message.content.strip()
        return jsonify({"data": {"email": email_body, "style": style}})
    except Exception as exc:
        return jsonify({"error": f"AI API error: {str(exc)}"}), 500
