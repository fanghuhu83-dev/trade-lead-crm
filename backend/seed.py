from datetime import datetime, timezone, timedelta
from models import db, User, Customer, Tag, FollowUp, ActivityLog


TAG_PALETTES = {
    "solar": [("VIP","amber"),("EU Distributor","violet"),("OEM Partner","blue"),("Long-term","emerald"),("Pilot","cyan")],
    "machinery": [("VIP","amber"),("Auto Tier-1","blue"),("CNC Shop","emerald"),("Prototype","cyan"),("Rush Order","rose")],
    "medical": [("VIP","amber"),("Hospital Chain","blue"),("PPE Bulk","emerald"),("Regulatory Pending","rose"),("GPO Member","violet")],
    "electronics": [("VIP","amber"),("PCB Buyer","blue"),("Sourcing Agent","cyan"),("Trial Order","emerald")],
    "packaging": [("VIP","amber"),("Food Grade","emerald"),("Retail Chain","violet"),("Startup Brand","cyan")],
}


def _make_tags(uid, palette_key):
    tags = {}
    for name, color in TAG_PALETTES[palette_key]:
        t = Tag(user_id=uid, name=name, color=color)
        db.session.add(t)
        tags[name] = t
    db.session.commit()
    return {t.name: t for t in Tag.query.filter_by(user_id=uid).all()}


def _seed_user(email, password, company, palette_key, customers_data):
    print(f"Seeding {company} ({email})...")
    u = User(email=email, company_name=company)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    uid = u.id
    tags = _make_tags(uid, palette_key)

    now = datetime.now(timezone.utc)
    for i, (name, country, cemail, industry, product, status, fav, tag_names) in enumerate(customers_data):
        c = Customer(
            user_id=uid, company_name=name, country=country, email=cemail,
            industry=industry, product_keyword=product, status=status, favorite=fav,
            created_at=now - timedelta(days=(len(customers_data)-i)*3, hours=i*5)
        )
        for tn in tag_names:
            if tn in tags:
                c.tags.append(tags[tn])
        db.session.add(c)
        db.session.flush()

        db.session.add(ActivityLog(customer_id=c.id, action="created",
            detail=f"Created customer: {name}", created_at=c.created_at))
        if status != "potential":
            db.session.add(ActivityLog(customer_id=c.id, action="status_changed",
                detail=f"Status: potential -> {status}", created_at=c.created_at + timedelta(hours=3)))
        if i % 3 == 0:
            db.session.add(FollowUp(customer_id=c.id,
                content=f"Sent initial outreach email regarding {product}.",
                created_at=c.created_at + timedelta(hours=2)))
        if i % 4 == 1:
            db.session.add(FollowUp(customer_id=c.id,
                content="Client responded positively, requested product catalog and FOB pricing.",
                created_at=c.created_at + timedelta(days=3)))

    db.session.commit()
    print(f"  -> {len(customers_data)} customers seeded for {company}")


def seed_data():
    """Seed database with demo users and customers. Call within Flask app context."""

    existing = db.session.execute(db.select(db.func.count(User.id))).scalar()
    if existing and existing > 0:
        print(f"Database already has {existing} users. Dropping and recreating...")
        db.drop_all()
        db.create_all()

    # ── Demo account (original) ──
    _seed_user("demo@example.com", "demo123", "Demo Trading Co.", "solar", [
        ("Nordic Solar Components AB","Sweden","procurement@nordicsolar.se","Renewable Energy","solar panel mounting system","won",True,["VIP","EU Distributor"]),
        ("Pacific Homeware Imports","United States","sourcing@pacifichomeware.com","Home Goods","stainless steel kitchenware","contacted",False,[]),
        ("Aster Medical Supply GmbH","Germany","buying@aster-medical.de","Medical Supplies","disposable medical gloves","following",True,["VIP"]),
        ("BrightBuild Distribution Ltd","United Kingdom","imports@brightbuild.co.uk","Construction","aluminum profiles","won",False,["OEM Partner"]),
        ("Maple Retail Group","Canada","category@mapleretail.ca","Packaging","eco packaging","potential",False,[]),
        ("Tokyo Tech Imports KK","Japan","sourcing@tokyotech.co.jp","Electronics","PCB assembly service","contacted",False,["OEM Partner"]),
        ("GreenVolt Energy Solutions","United States","supply@greenvolt.io","Renewable Energy","lithium battery pack","following",False,["Pilot"]),
        ("Alpen GmbH","Switzerland","info@alpen-tools.ch","Industrial Tools","CNC machining parts","lost",False,[]),
        ("Sao Paulo Auto Parts Ltda","Brazil","compras@spautoparts.com.br","Automotive","brake pads","potential",False,[]),
        ("Medina Trading LLC","UAE","import@medinatrading.ae","General Trading","LED lighting fixtures","won",True,["VIP","Long-term"]),
        ("Francois Import SARL","France","achats@francois-import.fr","Food & Beverage","food packaging machine","following",False,["EU Distributor"]),
        ("Korea Beauty Supply","South Korea","global@kbeautysupply.kr","Beauty & Cosmetics","cosmetic packaging","contacted",True,["Long-term"]),
        ("Outback Hardware Pty","Australia","buyers@outbackhw.com.au","Hardware","power tools","potential",False,[]),
        ("Durban Import Export","South Africa","tenders@durban-ie.co.za","Import/Export","textile fabrics","lost",False,[]),
        ("Milan Design House Srl","Italy","procurement@milandesign.it","Furniture","leather upholstery","following",False,["EU Distributor"]),
    ])

    # ── 华兴新能源 ──
    _seed_user("admin@huaxing-energy.com", "hx123456", "华兴新能源", "solar", [
        ("SunPower Europe GmbH","Germany","tender@sunpower-eu.de","Renewable Energy","solar panel mounting system","won",True,["VIP","EU Distributor"]),
        ("Helios Nordic AB","Sweden","purchase@heliosnordic.se","Solar Energy","ground mount racking","won",True,["Long-term","OEM Partner"]),
        ("PV Solutions California","United States","bids@pvsolutions.us","Solar Installation","rooftop solar brackets","won",True,["VIP"]),
        ("EcoVoltaic Spain SL","Spain","info@ecovoltaic.es","Renewable Energy","floating solar mounts","following",True,["EU Distributor","Pilot"]),
        ("Southern Solar Australia","Australia","supply@solarsouth.com.au","Solar Energy","carport solar structure","following",False,["OEM Partner"]),
        ("Energia Solar Mexico","Mexico","compras@energiasolar.mx","Renewable Energy","utility-scale racking","contacted",False,["Pilot"]),
        ("BrightSun Distribution","Canada","logistics@brightsun.ca","Solar Distribution","solar tracker components","contacted",False,["Long-term"]),
        ("NordVolt Energy","Norway","procurement@nordvolt.no","Green Energy","bifacial panel mounts","contacted",False,["EU Distributor"]),
        ("Terra Solar India","India","import@terrasolar.in","Solar Energy","agri-PV structures","potential",False,[]),
        ("SunRise Africa Ltd","Kenya","info@sunrise-africa.co.ke","Solar Off-grid","mini-grid mounting","potential",False,[]),
        ("PV Italia Srl","Italy","acquisti@pvtialia.it","Solar Installation","balcony solar brackets","lost",False,[]),
        ("Solaris Renewables UK","United Kingdom","buyer@solaris-uk.co.uk","Renewable Energy","solar farm racking","won",True,["VIP","EU Distributor"]),
    ])

    # ── 龙腾机械 ──
    _seed_user("sales@longteng-machinery.com", "lt123456", "龙腾机械", "machinery", [
        ("Bosch Automotive GmbH","Germany","supplier@bosch-auto.de","Automotive","CNC machining parts","won",True,["VIP","Auto Tier-1"]),
        ("Toyota Tsusho Corporation","Japan","procurement@toyota-tsusho.co.jp","Industrial Trading","precision shafts","won",True,["VIP"]),
        ("ZF Friedrichshafen AG","Germany","sourcing@zf.com","Auto Components","gearbox housings","following",True,["Auto Tier-1","Rush Order"]),
        ("Magna International","Canada","supply@magna.com","Automotive","stamping dies","following",False,["Auto Tier-1"]),
        ("Siemens Industrial","Germany","purchase.industry@siemens.com","Industrial Automation","motor components","contacted",True,["OEM Partner"]),
        ("Precision Parts Ohio","United States","rfq@precisionparts-oh.com","CNC Machining","custom flanges","contacted",False,["CNC Shop"]),
        ("Kawasaki Heavy Industries","Japan","procure@khi.co.jp","Heavy Industry","hydraulic valve bodies","contacted",False,["Prototype"]),
        ("MachiningWorks GmbH","Switzerland","info@machiningworks.ch","Precision Engineering","medical device components","potential",False,[]),
        ("AutoParts Brazil Ltda","Brazil","comprador@autoparts-br.com.br","Automotive","brake system components","potential",False,[]),
        ("Derwent Foundry Ltd","United Kingdom","buyer@derwent-foundry.co.uk","Metal Casting","sand casting patterns","lost",False,[]),
    ])

    # ── 美康医疗 ──
    _seed_user("export@meikang-medical.com", "mk123456", "美康医疗", "medical", [
        ("Medtronic Global Supply","Ireland","gsco@medtronic.com","Medical Devices","surgical instrument components","won",True,["VIP","Hospital Chain"]),
        ("Cardinal Health Inc","United States","sourcing@cardinalhealth.com","Healthcare Distribution","disposable medical gloves","won",True,["VIP","PPE Bulk"]),
        ("Fresenius Medical Care","Germany","procurement@fresenius.com","Dialysis Equipment","plastic consumables","following",True,["Hospital Chain","GPO Member"]),
        ("Henry Schein Europe","Netherlands","supply@henryschein.eu","Dental/Medical Supply","PPE kits","following",False,["PPE Bulk"]),
        ("McKesson Medical","United States","supplier@mckesson.com","Pharma Distribution","surgical masks","contacted",True,["VIP","PPE Bulk"]),
        ("B. Braun Melsungen AG","Germany","purchasing@bbraun.com","Medical Technology","IV tubing components","contacted",False,["GPO Member"]),
        ("Narang Medical Ltd","India","import@narang.com","Medical Equipment","hospital furniture","potential",False,[]),
        ("MediSupply Africa","South Africa","tender@medisupply.co.za","Medical Distribution","examination gloves","potential",False,[]),
        ("Premier Inc (GPO)","United States","contracts@premierinc.com","Group Purchasing","surgical drapes","contacted",False,["GPO Member","Regulatory Pending"]),
        ("Apotex Inc","Canada","procurement@apotex.com","Pharmaceutical","cleanroom supplies","lost",False,["Regulatory Pending"]),
    ])

    # ── 鼎丰电子 ──
    _seed_user("info@dingfeng-electronics.com", "df123456", "鼎丰电子", "electronics", [
        ("Samsung Electro-Mechanics","South Korea","sourcing@samsung-em.com","Electronics","PCB assembly service","contacted",True,["VIP","PCB Buyer"]),
        ("Foxconn Technology Group","Taiwan","supplier@foxconn.com","EMS Manufacturing","flexible PCB","contacted",False,["PCB Buyer","Trial Order"]),
        ("LG Innotek","South Korea","procurement@lginnotek.com","Electronic Components","LED substrate","contacted",False,["Sourcing Agent"]),
        ("Wistron Corporation","Taiwan","gsd@wistron.com","ODM Manufacturing","motherboard PCB","potential",False,[]),
        ("Jabil Circuit","United States","supplychain@jabil.com","EMS","rigid-flex PCB","potential",False,[]),
        ("Delta Electronics","Taiwan","purchase@deltaww.com","Power Electronics","power supply PCB","potential",False,["Trial Order"]),
        ("Shenzhen Huaqiang","China","info@hqonline.cn","Electronic Components Trading","connector assemblies","potential",False,[]),
        ("Volex plc","United Kingdom","sourcing@volex.com","Cable Assembly","custom cable harness","lost",False,[]),
    ])

    # ── 瑞达包装 ──
    _seed_user("hello@ruida-packaging.com", "rd123456", "瑞达包装", "packaging", [
        ("Nestle Procurement","Switzerland","packaging@nestle.com","Food & Beverage","eco packaging","won",True,["VIP","Food Grade"]),
        ("Unilever Global Sourcing","United Kingdom","sourcing@unilever.com","Consumer Goods","recycled packaging","following",True,["VIP","Retail Chain"]),
        ("Starbucks Supply Chain","United States","packaging@starbucks.com","Coffee Retail","compostable cups","following",False,["Retail Chain"]),
        ("Oatly AB","Sweden","procurement@oatly.com","Plant-based Food","sustainable cartons","contacted",True,["Food Grade","Startup Brand"]),
        ("Trader Joe''s","United States","private-label@traderjoes.com","Grocery Retail","branded packaging","contacted",False,["Retail Chain"]),
        ("Beyond Meat","United States","supply@beyondmeat.com","Plant Protein","biodegradable trays","potential",False,["Startup Brand"]),
        ("Aldi Sud","Germany","verpackung@aldi-sued.de","Discount Retail","cost-optimized packaging","potential",False,["Retail Chain"]),
        ("Just Eat Takeaway","Netherlands","sustainability@takeaway.com","Food Delivery","delivery packaging","lost",False,[]),
    ])

    total = db.session.execute(db.select(db.func.count(User.id))).scalar()
    print(f"Done. {total} users seeded.")
