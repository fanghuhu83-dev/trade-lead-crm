"""Ensure a demo user exists in the database. Called once at app startup."""

from datetime import datetime, timezone, timedelta
from models import db, User, Customer, Tag, FollowUp, ActivityLog

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo123456"
DEMO_COMPANY = "Demo Trading"


def ensure_demo_user():
    """Create demo user and 15 sample customers if not already present."""
    existing = db.session.execute(
        db.select(User).where(User.email == DEMO_EMAIL)
    ).scalar()
    if existing:
        existing.set_password(DEMO_PASSWORD)
        db.session.commit()
        return

    # Create demo user
    demo = User(email=DEMO_EMAIL, company_name=DEMO_COMPANY)
    demo.set_password(DEMO_PASSWORD)
    db.session.add(demo)
    db.session.commit()

    # Create tags
    tag_data = [
        ("VIP", "amber"),
        ("Hot Lead", "rose"),
        ("New", "cyan"),
        ("Pending", "violet"),
        ("Regular", "slate"),
    ]
    tag_map = {}
    for name, color in tag_data:
        t = Tag(user_id=demo.id, name=name, color=color)
        db.session.add(t)
        tag_map[name] = t
    db.session.commit()

    now = datetime.now(timezone.utc)

    # 15 customers: outdoor furniture(5), kitchenware(5), electronics(5)
    # Status: potential(5), contacted(4), following(3), won(2), lost(1)
    customers_data = [
        # ── Outdoor Furniture ──
        ("Sunset Patio Inc", "United States", "buyer@sunsetpatio.com", "Outdoor Furniture",
         "aluminum garden sets", "potential", [tag_map["New"]],
         "Reached out via LinkedIn InMail"),
        ("Terraza Living Spain", "Spain", "import@terrazaliving.es", "Outdoor Furniture",
         "rattan sofa sets", "contacted", [tag_map["Hot Lead"], tag_map["Regular"]],
         "Requested FOB pricing for 20ft container"),
        ("Balcony Bliss GmbH", "Germany", "procurement@balconybliss.de", "Outdoor Furniture",
         "balcony table sets", "following", [tag_map["Hot Lead"]],
         "Asked for material samples — shipping DHL"),
        ("GardenPro Australia", "Australia", "sales@gardenpro.au", "Outdoor Furniture",
         "outdoor dining sets", "following", [tag_map["Regular"]],
         "Negotiating volume discount"),
        ("VillaStyle Italy", "Italy", "ordini@villastyle.it", "Outdoor Furniture",
         "luxury sun loungers", "won", [tag_map["VIP"]],
         "Signed annual contract — Q1 2026 delivery"),

        # ── Kitchenware ──
        ("ChefLine Distribution", "Canada", "buyers@chefline.ca", "Kitchenware",
         "stainless steel cookware", "potential", [tag_map["New"], tag_map["Regular"]],
         "Found via Alibaba inquiry"),
        ("CookMaster UK", "United Kingdom", "purchase@cookmaster.co.uk", "Kitchenware",
         "non-stick pan sets", "potential", [tag_map["New"]],
         "Sent product catalog PDF"),
        ("HomeChef Japan", "Japan", "import@homechef.jp", "Kitchenware",
         "ceramic knife sets", "contacted", [tag_map["Hot Lead"], tag_map["Pending"]],
         "Requested samples — 3 knife sets shipped"),
        ("BistroSupply France", "France", "achats@bistrosupply.fr", "Kitchenware",
         "commercial cookware", "contacted", [tag_map["Regular"]],
         "Phone call scheduled for next Monday"),
        ("Nordic Kitchen AB", "Sweden", "info@nordickitchen.se", "Kitchenware",
         "silicone kitchen tools", "following", [tag_map["Pending"]],
         "Waiting for CE certification docs"),

        # ── Electronics ──
        ("TechNova LLC", "United Arab Emirates", "sourcing@technova.ae", "Electronics",
         "wireless earbuds", "potential", [tag_map["New"]],
         "Received RFQ for 5000 units"),
        ("CableNet Brasil", "Brazil", "compras@cablenet.com.br", "Electronics",
         "USB-C charging cables", "potential", [tag_map["New"]],
         "Competitive quote needed — tight budget"),
        ("PowerGear Korea", "South Korea", "bid@powergear.kr", "Electronics",
         "power banks 20000mAh", "contacted", [tag_map["Hot Lead"]],
         "Sent certification docs (KC, CE, FCC)"),
        ("GigaStore Mexico", "Mexico", "import@gigastore.mx", "Electronics",
         "bluetooth speakers", "won", [tag_map["VIP"], tag_map["Regular"]],
         "First order 2000 units shipped March 2026"),
        ("ElecTrade India", "India", "info@electrade.in", "Electronics",
         "smart plugs", "lost", [tag_map["Regular"]],
         "Price mismatch — competitor offered 12% lower"),
    ]

    for i, (name, country, email, industry, product, status, tags, note) in enumerate(customers_data):
        c = Customer(
            user_id=demo.id,
            company_name=name,
            country=country,
            email=email,
            industry=industry,
            product_keyword=product,
            status=status,
            website=f"https://www.{name.lower().replace(' ', '')}.com",
            favorite=(status in ("won", "following")),
            created_at=now - timedelta(days=(len(customers_data) - i) * 3, hours=i * 5),
        )
        for tag in tags:
            c.tags.append(tag)
        db.session.add(c)
        db.session.flush()

        # Activity log
        db.session.add(ActivityLog(
            customer_id=c.id, action="created",
            detail=f"Created customer: {name}",
            created_at=c.created_at,
        ))
        if status != "potential":
            db.session.add(ActivityLog(
                customer_id=c.id, action="status_changed",
                detail=f"Status: potential -> {status}",
                created_at=c.created_at + timedelta(hours=3),
            ))

        # Follow-up notes
        if note:
            db.session.add(FollowUp(
                customer_id=c.id,
                content=note,
                created_at=c.created_at + timedelta(hours=2),
            ))
        if i % 3 == 0:
            db.session.add(FollowUp(
                customer_id=c.id,
                content=f"Initial outreach sent regarding {product}.",
                created_at=c.created_at + timedelta(hours=1),
            ))

    db.session.commit()
    print(f"Demo user created: {DEMO_EMAIL} with {len(customers_data)} customers")
