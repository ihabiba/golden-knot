from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta
import random


class Command(BaseCommand):
    help = "Seed the database with realistic Golden Knot test data."

    # ── Seed data definitions ──────────────────────────────────────────────────

    ADMIN = {"email": "admin@goldenknot.com", "username": "admin", "password": "admin123"}

    SELLERS = [
        {
            "email": "seller1@test.com",
            "username": "fatima_rugs",
            "password": "test1234",
            "store_name": "Fatima's Afghan Rugs",
            "bio": (
                "Based in Kabul, Fatima has been weaving traditional Afghan rugs for over "
                "20 years. Each piece is hand-knotted using locally sourced wool and "
                "natural dyes passed down through four generations of her family."
            ),
            "location": "Kabul, Afghanistan",
        },
        {
            "email": "seller2@test.com",
            "username": "kabul_weave",
            "password": "test1234",
            "store_name": "Kabul Weave House",
            "bio": (
                "A collective of 12 skilled weavers from Kabul's historic weaving district. "
                "We specialise in Bokhara and Turkoman designs, using wool imported from "
                "the Pamir mountains for exceptional durability and lustre."
            ),
            "location": "Kabul, Afghanistan",
        },
        {
            "email": "seller3@test.com",
            "username": "herat_textiles",
            "password": "test1234",
            "store_name": "Herat Textile Arts",
            "bio": (
                "Herat is the ancient heart of Afghan textile artistry. Our workshop "
                "employs women artisans who produce exquisite kilims, cushion covers, "
                "and wall hangings using techniques dating back to the Silk Road era."
            ),
            "location": "Herat, Afghanistan",
        },
    ]

    CUSTOMERS = [
        {"email": f"customer{i}@test.com", "username": f"customer{i}", "password": "test1234"}
        for i in range(1, 6)
    ]

    CATEGORIES = [
        {"name": "Hand-Knotted Rugs",  "slug": "hand-knotted-rugs",  "description": "Authentic hand-knotted rugs crafted using traditional Afghan techniques and premium wool."},
        {"name": "Kilim Rugs",         "slug": "kilim-rugs",         "description": "Flat-woven kilim rugs featuring bold geometric patterns and vibrant natural dyes."},
        {"name": "Cushion Covers",     "slug": "cushion-covers",     "description": "Hand-embroidered and woven cushion covers that bring Afghan artistry to your home."},
        {"name": "Wall Hangings",      "slug": "wall-hangings",      "description": "Statement wall textiles combining traditional motifs with exceptional craftsmanship."},
        {"name": "Prayer Rugs",        "slug": "prayer-rugs",        "description": "Finely crafted prayer rugs featuring traditional mihrab designs and soft wool pile."},
        {"name": "Table Runners",      "slug": "table-runners",      "description": "Hand-loomed table runners that add an authentic Afghan touch to any dining space."},
    ]

    PRODUCTS = [
        # ── Hand-Knotted Rugs ──
        {
            "name": "Qashqai Hand-Knotted Wool Rug",
            "category": "Hand-Knotted Rugs",
            "seller": "seller1@test.com",
            "description": (
                "A stunning Qashqai-style rug hand-knotted by master artisan Fatima using "
                "100% hand-spun wool. The rich medallion design features deep crimson, "
                "ivory, and indigo — colours achieved with pomegranate and walnut husk dyes. "
                "Approximately 6×9 ft. Each knot tied by hand, 180 KPSI density."
            ),
            "price": "450.00",
            "stock": 3,
        },
        {
            "name": "Bokhara Tribal Carpet",
            "category": "Hand-Knotted Rugs",
            "seller": "seller2@test.com",
            "description": (
                "Classic Bokhara gul (elephant foot) motifs repeat across this warm "
                "burgundy field. Hand-knotted by weavers in Kabul using Ghazni highland "
                "wool, known for its silky texture and exceptional durability. Size 5×8 ft."
            ),
            "price": "650.00",
            "stock": 2,
        },
        {
            "name": "Mazar-i-Sharif Silk Blend Rug",
            "category": "Hand-Knotted Rugs",
            "seller": "seller1@test.com",
            "description": (
                "A luxurious silk-and-wool blend rug from northern Afghanistan. The fine "
                "floral lattice pattern shimmers under light, shifting from gold to ivory. "
                "360 KPSI, approximately 4×6 ft. A true collector's piece."
            ),
            "price": "800.00",
            "stock": 1,
        },
        {
            "name": "Chobi Ziegler Hand-Knotted Rug",
            "category": "Hand-Knotted Rugs",
            "seller": "seller2@test.com",
            "description": (
                "Inspired by antique Persian designs, this Chobi rug uses vegetable-dyed "
                "wool in soft terracotta, sage, and cream tones that mellow beautifully "
                "with age. Hand-knotted, 8×10 ft, approximately 120 KPSI."
            ),
            "price": "520.00",
            "stock": 4,
        },
        # ── Kilim Rugs ──
        {
            "name": "Flat-Weave Tribal Kilim Runner",
            "category": "Kilim Rugs",
            "seller": "seller3@test.com",
            "description": (
                "A bold flat-weave kilim runner featuring Caucasian-inspired diamond and "
                "lozenge motifs in terracotta, navy, and ivory. Hand-woven on a traditional "
                "loom in Herat. Reversible, 2.5×8 ft. Ideal for hallways."
            ),
            "price": "189.00",
            "stock": 8,
        },
        {
            "name": "Geometric Afghan Kilim",
            "category": "Kilim Rugs",
            "seller": "seller2@test.com",
            "description": (
                "Strong geometric patterns in warm earth tones define this versatile kilim. "
                "Flat-woven in pure wool with natural dyes — madder red, indigo, and undyed "
                "cream. Lightweight and reversible, 5×7 ft."
            ),
            "price": "240.00",
            "stock": 6,
        },
        {
            "name": "Vintage-Style Sumak Kilim",
            "category": "Kilim Rugs",
            "seller": "seller1@test.com",
            "description": (
                "Sumak-technique kilims are thicker and more textured than standard "
                "flat-weaves. This piece uses a supplementary weft wrap to create a "
                "raised geometric design in deep jewel tones. 4×6 ft."
            ),
            "price": "210.00",
            "stock": 5,
        },
        # ── Cushion Covers ──
        {
            "name": "Hand-Embroidered Silk Cushion Cover",
            "category": "Cushion Covers",
            "seller": "seller3@test.com",
            "description": (
                "Intricate chain-stitch embroidery covers every inch of this luxurious "
                "cushion cover. Crafted on silk dupioni fabric in Herat using traditional "
                "Afghan needle techniques. 45×45 cm, zip closure, insert not included."
            ),
            "price": "45.00",
            "stock": 20,
        },
        {
            "name": "Suzani Embroidered Pillow Cover",
            "category": "Cushion Covers",
            "seller": "seller2@test.com",
            "description": (
                "Inspired by Central Asian suzani tradition, this cushion cover features "
                "bold floral medallions hand-embroidered in vibrant silk thread on cream "
                "cotton. 50×50 cm. Each piece unique — slight variations are intentional."
            ),
            "price": "55.00",
            "stock": 15,
        },
        {
            "name": "Kilim Patchwork Cushion Set (2 pieces)",
            "category": "Cushion Covers",
            "seller": "seller3@test.com",
            "description": (
                "Two cushion covers crafted from reclaimed kilim fragments, each with a "
                "unique combination of geometric motifs. Backed with natural linen. "
                "40×40 cm each. A sustainable way to own a piece of Afghan weaving history."
            ),
            "price": "65.00",
            "stock": 12,
        },
        # ── Wall Hangings ──
        {
            "name": "Traditional Afghan War Rug Wall Hanging",
            "category": "Wall Hangings",
            "seller": "seller1@test.com",
            "description": (
                "A unique piece of living history — Afghan war rugs document the country's "
                "turbulent decades through traditional weaving motifs reimagined in textile "
                "form. Hand-knotted wool, approximately 3×5 ft, includes wooden hanging rod."
            ),
            "price": "320.00",
            "stock": 2,
        },
        {
            "name": "Hazara Embroidered Silk Panel",
            "category": "Wall Hangings",
            "seller": "seller3@test.com",
            "description": (
                "Delicate mirror-work embroidery from Afghanistan's Hazara region. Tiny "
                "convex mirrors are set into intricate geometric embroidered frames on "
                "black velvet. 60×90 cm, with brass rings for hanging."
            ),
            "price": "195.00",
            "stock": 4,
        },
        {
            "name": "Hand-Woven Silk Tapestry",
            "category": "Wall Hangings",
            "seller": "seller2@test.com",
            "description": (
                "A museum-quality silk tapestry woven on a traditional frame loom. "
                "The design depicts a garden paradise scene with intricate floral borders "
                "in gold, coral, and teal. 90×120 cm, lined with cotton backing."
            ),
            "price": "480.00",
            "stock": 1,
        },
        # ── Prayer Rugs ──
        {
            "name": "Bokhara Wool Prayer Mat",
            "category": "Prayer Rugs",
            "seller": "seller1@test.com",
            "description": (
                "A beautifully detailed prayer rug featuring a classic mihrab arch design "
                "in deep burgundy and ivory. Hand-knotted with soft Ghazni wool pile. "
                "Approximately 2×4 ft — the ideal prayer rug size."
            ),
            "price": "89.00",
            "stock": 10,
        },
        {
            "name": "Floral Afghan Sajjada",
            "category": "Prayer Rugs",
            "seller": "seller2@test.com",
            "description": (
                "This sajjada (prayer rug) features a delicate floral mihrab with a "
                "Quranic border in hand-spun wool. The soft pastel palette of rose, "
                "green, and cream creates a serene and meditative atmosphere."
            ),
            "price": "135.00",
            "stock": 7,
        },
        {
            "name": "Geometric Prayer Rug with Kufic Border",
            "category": "Prayer Rugs",
            "seller": "seller3@test.com",
            "description": (
                "A striking prayer rug with bold geometric mihrab and a Kufic script "
                "border repeating a traditional blessing. Flat-woven wool in deep navy "
                "and gold. 2×3 ft, lightweight and easy to carry."
            ),
            "price": "110.00",
            "stock": 9,
        },
        # ── Table Runners ──
        {
            "name": "Ikat Hand-Loomed Table Runner",
            "category": "Table Runners",
            "seller": "seller2@test.com",
            "description": (
                "An ikat-dyed table runner where the yarn is resist-dyed before weaving, "
                "creating the characteristic blurred, feathered pattern edges. Pure silk "
                "in sunrise tones of saffron, rust, and ivory. 35×180 cm."
            ),
            "price": "75.00",
            "stock": 14,
        },
        {
            "name": "Kilim Striped Table Runner",
            "category": "Table Runners",
            "seller": "seller1@test.com",
            "description": (
                "Classic kilim-weave stripes in rich jewel tones — ruby, sapphire, "
                "and gold — make this table runner a striking centrepiece. Hand-woven "
                "in pure wool. 40×200 cm, fringed ends."
            ),
            "price": "85.00",
            "stock": 18,
        },
        {
            "name": "Suzani Embroidered Table Cover",
            "category": "Table Runners",
            "seller": "seller3@test.com",
            "description": (
                "Hand-embroidered with bold suzani floral motifs in silk thread on "
                "natural linen. Works equally as a table runner, wall hanging, or bed "
                "scarf. 45×180 cm. Machine-wash cold, gentle cycle."
            ),
            "price": "95.00",
            "stock": 11,
        },
        {
            "name": "Afghan Gabbeh Table Runner",
            "category": "Table Runners",
            "seller": "seller2@test.com",
            "description": (
                "Inspired by the naive, expressive Gabbeh weaving tradition of nomadic "
                "tribes, this table runner features playful animal and tree motifs in "
                "undyed natural wool. 30×150 cm, each piece one-of-a-kind."
            ),
            "price": "65.00",
            "stock": 8,
        },
    ]

    REVIEWS = [
        {"product": "Qashqai Hand-Knotted Wool Rug",         "customer": "customer1@test.com", "rating": 5, "comment": "Absolutely stunning rug. The colours are even more vivid in person and the quality is exceptional. Arrived well-packed and on time. Will definitely buy again."},
        {"product": "Bokhara Tribal Carpet",                 "customer": "customer2@test.com", "rating": 5, "comment": "My living room has been completely transformed. The craftsmanship is extraordinary — you can feel the density of the knots underfoot. Worth every penny."},
        {"product": "Flat-Weave Tribal Kilim Runner",        "customer": "customer3@test.com", "rating": 4, "comment": "Beautiful kilim, colours are exactly as described. Slight variation in pattern which I was told to expect — adds to the handmade charm. Very happy with the purchase."},
        {"product": "Hand-Embroidered Silk Cushion Cover",   "customer": "customer4@test.com", "rating": 5, "comment": "The embroidery detail is breathtaking. I've received so many compliments since placing this on my sofa. The silk fabric feels incredibly luxurious."},
        {"product": "Suzani Embroidered Pillow Cover",       "customer": "customer5@test.com", "rating": 4, "comment": "Gorgeous pattern and good quality. The colours are slightly brighter than on screen but still beautiful. Delivery was fast and packaging was excellent."},
        {"product": "Traditional Afghan War Rug Wall Hanging","customer": "customer1@test.com", "rating": 5, "comment": "A fascinating and deeply meaningful piece of art. The wooden rod and hanging hardware were included. This is museum quality for a fair price."},
        {"product": "Bokhara Wool Prayer Mat",               "customer": "customer2@test.com", "rating": 5, "comment": "The softness of the wool pile is remarkable. The mihrab design is crisp and the colours have not faded after several months of daily use."},
        {"product": "Ikat Hand-Loomed Table Runner",         "customer": "customer3@test.com", "rating": 4, "comment": "Elegant and unique. The ikat pattern is more subtle than I expected but still very beautiful. The silk sheen catches the light beautifully at dinner."},
        {"product": "Geometric Afghan Kilim",                "customer": "customer4@test.com", "rating": 3, "comment": "Good quality kilim with beautiful colours. A bit smaller than I imagined but fits well in my hallway. The weaving is tight and even throughout."},
        {"product": "Hazara Embroidered Silk Panel",         "customer": "customer5@test.com", "rating": 5, "comment": "The mirror-work on this panel is extraordinary — it catches the light in the most beautiful way. A true work of art that has become the focal point of my bedroom."},
    ]

    PROMO_CODES = [
        {
            "code": "WELCOME10",
            "discount_type": "percentage",
            "discount_value": "10.00",
            "minimum_order": "0.00",
            "max_uses": None,
            "valid_from": timezone.now(),
            "valid_until": timezone.now() + timedelta(days=365),
            "is_active": True,
        },
        {
            "code": "GOLDEN20",
            "discount_type": "percentage",
            "discount_value": "20.00",
            "minimum_order": "100.00",
            "max_uses": 500,
            "valid_from": timezone.now(),
            "valid_until": timezone.now() + timedelta(days=180),
            "is_active": True,
        },
    ]

    # ── Counters ───────────────────────────────────────────────────────────────

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.created = 0
        self.skipped = 0

    # ── Handle ─────────────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n🌿  Golden Knot — Database Seeder\n"))

        from django.contrib.auth import get_user_model
        self.User = get_user_model()

        self._seed_admin()
        self._seed_sellers()
        self._seed_customers()
        self._seed_categories()
        self._seed_products()
        self._seed_reviews()
        self._seed_promo_codes()

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  ✅  Done — {self.created} records created, {self.skipped} already existed."))
        self.stdout.write("")

    # ── Seeders ────────────────────────────────────────────────────────────────

    def _seed_admin(self):
        self.stdout.write("  👤  Admin user …", ending=" ")
        user, created = self.User.objects.get_or_create(
            email=self.ADMIN["email"],
            defaults={
                "username": self.ADMIN["username"],
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password(self.ADMIN["password"])
            user.save()
            self._ok("created")
        else:
            self._skip()

    def _seed_sellers(self):
        from store.models import SellerProfile
        self.stdout.write("  🧑‍🎨  Seller users & profiles …", ending=" ")
        count = 0
        for data in self.SELLERS:
            user, u_created = self.User.objects.get_or_create(
                email=data["email"],
                defaults={"username": data["username"], "role": "seller"},
            )
            if u_created:
                user.set_password(data["password"])
                user.save()
                count += 1

            SellerProfile.objects.get_or_create(
                user=user,
                defaults={
                    "store_name": data["store_name"],
                    "bio": data["bio"],
                    "location": data["location"],
                    "status": "approved",
                },
            )
        if count:
            self._ok(f"{count} created")
        else:
            self._skip()

    def _seed_customers(self):
        self.stdout.write("  🛍️   Customer users …", ending=" ")
        count = 0
        for data in self.CUSTOMERS:
            user, created = self.User.objects.get_or_create(
                email=data["email"],
                defaults={"username": data["username"], "role": "customer"},
            )
            if created:
                user.set_password(data["password"])
                user.save()
                count += 1
        if count:
            self._ok(f"{count} created")
        else:
            self._skip()

    def _seed_categories(self):
        from products.models import Category
        self.stdout.write("  📂  Categories …", ending=" ")
        count = 0
        for data in self.CATEGORIES:
            _, created = Category.objects.get_or_create(
                slug=data["slug"],
                defaults={"name": data["name"], "description": data["description"]},
            )
            if created:
                count += 1
        if count:
            self._ok(f"{count} created")
        else:
            self._skip()

    def _seed_products(self):
        from products.models import Category, Product
        self.stdout.write("  🪡  Products …", ending=" ")
        count = 0
        for data in self.PRODUCTS:
            slug = slugify(data["name"])
            seller = self.User.objects.get(email=data["seller"])
            category = Category.objects.get(name=data["category"])
            _, created = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    "seller": seller,
                    "category": category,
                    "name": data["name"],
                    "description": data["description"],
                    "price": data["price"],
                    "stock": data["stock"],
                    "is_active": True,
                    "is_approved": True,
                    "location": seller.seller_profile.location,
                },
            )
            if created:
                count += 1
        if count:
            self._ok(f"{count} created")
        else:
            self._skip()

    def _seed_reviews(self):
        from products.models import Product
        from reviews.models import Review
        self.stdout.write("  ⭐  Reviews …", ending=" ")
        count = 0
        for data in self.REVIEWS:
            try:
                product = Product.objects.get(name=data["product"])
                customer = self.User.objects.get(email=data["customer"])
            except (Product.DoesNotExist, self.User.DoesNotExist):
                continue
            _, created = Review.objects.get_or_create(
                product=product,
                customer=customer,
                defaults={"rating": data["rating"], "comment": data["comment"]},
            )
            if created:
                count += 1
        if count:
            self._ok(f"{count} created")
        else:
            self._skip()

    def _seed_promo_codes(self):
        from promotions.models import PromoCode
        self.stdout.write("  🎟️   Promo codes …", ending=" ")
        count = 0
        for data in self.PROMO_CODES:
            _, created = PromoCode.objects.get_or_create(
                code=data["code"],
                defaults={
                    "discount_type": data["discount_type"],
                    "discount_value": data["discount_value"],
                    "minimum_order": data["minimum_order"],
                    "max_uses": data["max_uses"],
                    "valid_from": data["valid_from"],
                    "valid_until": data["valid_until"],
                    "is_active": data["is_active"],
                },
            )
            if created:
                count += 1
        if count:
            self._ok(f"{count} created")
        else:
            self._skip()

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _ok(self, msg: str):
        self.stdout.write(self.style.SUCCESS(f"{msg}"))
        self.created += 1

    def _skip(self):
        self.stdout.write(self.style.WARNING("already exists, skipped"))
        self.skipped += 1
