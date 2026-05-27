from flask import Blueprint, jsonify, request
from openai import OpenAI
from config import AI_API_KEY, AI_MODEL, AI_BASE_URL
from middleware import login_required

email_gen_bp = Blueprint("email_gen", __name__)

# ── Existing style prompts (kept for backward compatibility) ──
STYLE_PROMPTS = {
    "concise": "Write a brief, punchy cold email. Use 3-4 short paragraphs maximum. Get straight to the point \u2014 no fluff. Professional but friendly tone.",
    "formal": "Write a formal business development email. Use proper salutation and closing, structured paragraphs, and formal language. Sound polished and executive-level.",
    "marketing": "Write a persuasive, benefit-driven sales email. Lead with a compelling hook, highlight key value propositions with brief bullet-style points (using dashes), and end with a clear call to action. Sound enthusiastic but credible.",
}

ALLOWED_STYLES = list(STYLE_PROMPTS.keys())

# ── Existing base prompt (kept for backward compatibility) ──
BASE_SYSTEM_PROMPT = """You are an expert B2B foreign-trade sales copywriter. 
Your task is to write cold outreach emails in English for a Chinese exporter reaching out to overseas buyers.

IMPORTANT RULES:
- Write ONLY the email body. Do NOT write a subject line.
- Do NOT include placeholder brackets like [Name] or [Company]. Use generic salutation.
- Use the sender's company as "we" \u2014 the Chinese exporter.
- Keep the email natural, warm, and human \u2014 not robotic or template-like.
- Never mention that you are AI or that the email was generated.
- Sign off with a realistic sender name and title."""

# ── New scene prompts ──
SCENE_PROMPTS = {
    "first_contact": """You are writing a FIRST cold outreach email to a potential overseas buyer.

Structure:
1. Warm greeting
2. Brief self-introduction: who you are and what your company does
3. Company credibility: mention years in industry, key certifications, or notable clients
4. Product highlight: spotlight 1-2 key products with a key benefit or differentiator
5. Call to action: invite a reply, suggest a call, or offer samples/catalog
6. Professional closing with sender name and title

KEY REQUIREMENTS:
- Sound like a real person reaching out, not a bulk mail merge
- Show you have done research on their company/industry
- Keep it 150-200 words
- Use business English, no complex vocabulary""",

    "sample_followup": """You are writing a FOLLOW-UP email after sending product samples to a buyer.

Structure:
1. Friendly greeting
2. Confirm the samples were delivered / ask if they arrived safely
3. Briefly recap what was sent (product names, specs)
4. Ask for initial impressions or feedback
5. Mention you are available for questions or customization requests
6. Soft push toward next step: trial order, video call, or quote request
7. Professional closing

KEY REQUIREMENTS:
- Be helpful, not pushy
- Show genuine interest in their feedback
- Keep it 150-200 words
- Use business English, no complex vocabulary""",

    "order_confirmation": """You are writing an ORDER CONFIRMATION email to a buyer who has placed an order.

Structure:
1. Thank the buyer for their order and trust
2. Recap order details: product, quantity, agreed price if applicable
3. Confirm production timeline and estimated ship date
4. Mention payment terms and next steps
5. Provide a point of contact for any questions
6. Express enthusiasm for long-term cooperation
7. Professional closing

KEY REQUIREMENTS:
- Be clear, precise, and reassuring
- Include specific details (the model will fill them from context)
- Keep it 150-200 words
- Use business English, no complex vocabulary""",

    "holiday_greeting": """You are writing a HOLIDAY GREETING email to maintain relationships with overseas buyers.

Structure:
1. Warm holiday wishes appropriate to the season
2. Express gratitude for the business relationship
3. Brief company update or well-wishes for their business
4. Light product mention: new arrivals, upcoming catalog, or seasonal promotion (1 sentence max)
5. Friendly closing looking forward to continued cooperation

KEY REQUIREMENTS:
- Focus on relationship, not selling
- Keep product mention minimal and natural
- Keep it 150-200 words
- Use business English, no complex vocabulary""",

    "after_sales": """You are writing an AFTER-SALES FOLLOW-UP email to a buyer who purchased products previously.

Structure:
1. Friendly greeting
2. Ask how the products are performing / if everything meets expectations
3. Offer support: technical assistance, replacement parts, or usage tips
4. Mention any relevant new products, upgrades, or reorder information (light touch)
5. Invite feedback or a testimonial if appropriate
6. Professional closing

KEY REQUIREMENTS:
- Show genuine care about their experience
- Be helpful, not salesy
- Keep it 150-200 words
- Use business English, no complex vocabulary""",
}

ALLOWED_SCENES = list(SCENE_PROMPTS.keys())

# ── Tone instructions ──
TONE_INSTRUCTIONS = {
    "formal": "Use a formal, respectful business tone. Use full names, proper titles, and avoid contractions.",
    "neutral": "Use a balanced, professional tone. Be polite but not overly formal. Contractions are acceptable.",
    "friendly": "Use a warm, approachable tone. Be conversational yet professional. Contractions and friendly expressions welcome.",
}

ALLOWED_TONES = list(TONE_INSTRUCTIONS.keys())

# ── Fallback template when AI API fails ──
FALLBACK_EMAIL_TEMPLATE = """Dear Sir/Madam,

I hope this message finds you well. My name is [Sender], and I am the Sales Manager at [Company], a leading manufacturer and exporter based in China with over 10 years of experience in the industry.

I am writing to introduce our high-quality product line, which has been well received by clients across Europe, North America, and Southeast Asia. Our products are manufactured under strict quality control standards and come with full certifications, including ISO 9001 and CE.

We would welcome the opportunity to discuss how our offerings could support your business. I would be happy to send you our latest catalog and competitive pricing upon your request.

I look forward to hearing from you.

Best regards,
[Sender Name]
Sales Manager
[Company Name]"""


def build_user_prompt(company_name, product_name, country, industry, style, scene, tone, contact_name):
    """Build the user prompt string, combining style + scene + tone params."""
    parts = []

    # Scene-specific instructions (new)
    if scene in SCENE_PROMPTS:
        parts.append(SCENE_PROMPTS[scene])
    else:
        parts.append(SCENE_PROMPTS["first_contact"])

    # Context details
    detail_lines = []
    detail_lines.append(f"Recipient company: {company_name}")
    detail_lines.append(f"Product: {product_name}")
    if contact_name:
        detail_lines.append(f"Contact person: {contact_name}")
    if country:
        detail_lines.append(f"Country: {country}")
    if industry:
        detail_lines.append(f"Industry: {industry}")
    detail_lines.append("")

    parts.append("\n".join(detail_lines))

    # Style instruction (existing)
    if style in STYLE_PROMPTS:
        parts.append(f"\nStyle guidance: {STYLE_PROMPTS[style]}")

    # Tone instruction (new)
    if tone in TONE_INSTRUCTIONS:
        parts.append(f"\nTone: {TONE_INSTRUCTIONS[tone]}")

    # Global constraints
    parts.append("\nIMPORTANT: Keep the email 150-200 words. Use business English. Avoid complex vocabulary.")
    parts.append("Structure the email as: greeting -> self-introduction -> product highlights -> call to action -> closing.")

    return "\n".join(parts)


@email_gen_bp.post("")
@login_required
def generate_email():
    payload = request.get_json(silent=True) or {}

    # Required fields (existing)
    company_name = (payload.get("companyName") or "").strip()
    product_name = (payload.get("productName") or "").strip()

    # Optional fields (existing)
    country = (payload.get("country") or "").strip()
    industry = (payload.get("industry") or "").strip()
    style = (payload.get("style") or "concise").strip()

    # New optional fields
    scene = (payload.get("scene") or "first_contact").strip()
    tone = (payload.get("tone") or "neutral").strip()
    contact_name = (payload.get("contactName") or "").strip()

    # Validation
    errors = {}
    if not company_name:
        errors["companyName"] = "Company name is required."
    if not product_name:
        errors["productName"] = "Product name is required."
    if style not in ALLOWED_STYLES:
        errors["style"] = f"Invalid style. Allowed: {', '.join(ALLOWED_STYLES)}."
    if scene not in ALLOWED_SCENES:
        errors["scene"] = f"Invalid scene. Allowed: {', '.join(ALLOWED_SCENES)}."
    if tone not in ALLOWED_TONES:
        errors["tone"] = f"Invalid tone. Allowed: {', '.join(ALLOWED_TONES)}."
    if errors:
        return jsonify({"error": "Validation failed.", "fields": errors}), 400

    if not AI_API_KEY:
        return jsonify({"error": "AI API key is not configured. Set AI_API_KEY in .env"}), 500

    user_prompt = build_user_prompt(
        company_name, product_name, country, industry,
        style, scene, tone, contact_name,
    )

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
        return jsonify({"data": {"email": email_body, "style": style, "scene": scene, "tone": tone}})
    except Exception:
        # Return fallback template on any AI error
        return jsonify({
            "data": {
                "email": FALLBACK_EMAIL_TEMPLATE.strip(),
                "style": style,
                "scene": scene,
                "tone": tone,
                "fallback": True,
            }
        })
