"""
iBood Signals Intelligence - Signal Type Definitions

Based on IBOOD_SIGNALS_INTELLIGENCE_SPEC.md
Defines all signal types, priorities, and category taxonomy
"""

from enum import Enum
from typing import TypedDict


class SignalType(str, Enum):
    """All signal types for iBood deal sourcing"""
    # Hot Signals (Immediate Action)
    INVENTORY_SURPLUS = "inventory_surplus"
    EARNINGS_MISS = "earnings_miss"
    PRODUCT_DISCONTINUATION = "product_discontinuation"
    WAREHOUSE_CLEARANCE = "warehouse_clearance"
    LEADERSHIP_CHANGE = "leadership_change"
    DEBT_PRESSURE = "debt_pressure"

    # Strategic Signals (Monitor)
    EUROPEAN_MARKET_ENTRY = "european_market_entry"
    NEW_FACTORY = "new_factory"
    PRODUCT_LAUNCH_OVERRUN = "product_launch_overrun"
    SEASONAL_CLEARANCE = "seasonal_clearance"
    RETAILER_DELISTING = "retailer_delisting"
    DISTRIBUTION_CHANGE = "distribution_change"

    # Market Signals (Intelligence)
    CATEGORY_OVERSUPPLY = "category_oversupply"
    RAW_MATERIAL_PRICE_DROP = "raw_material_price_drop"
    COMPETITOR_BANKRUPTCY = "competitor_bankruptcy"
    TRADE_POLICY_CHANGE = "trade_policy_change"
    CURRENCY_SHIFT = "currency_shift"
    SHIPPING_COST_DROP = "shipping_cost_drop"

    # Relationship Signals (Nurture)
    TRADE_SHOW_ATTENDANCE = "trade_show_attendance"
    NEW_PRODUCT_ANNOUNCEMENT = "new_product_announcement"
    SUSTAINABILITY_INITIATIVE = "sustainability_initiative"
    AWARD_RECOGNITION = "award_recognition"
    NEW_SALES_LEADER = "new_sales_leader"
    PARTNERSHIP_ANNOUNCEMENT = "partnership_announcement"


class SignalPriority(str, Enum):
    """Signal priority levels"""
    HOT = "hot"           # Immediate action required
    STRATEGIC = "strategic"  # Monitor for upcoming deals
    MARKET = "market"     # Market intelligence
    RELATIONSHIP = "relationship"  # Long-term nurture


class SignalStatus(str, Enum):
    """Signal lifecycle status"""
    NEW = "new"
    VIEWED = "viewed"
    ACTIONED = "actioned"
    DISMISSED = "dismissed"
    EXPIRED = "expired"


class CompanyStatus(str, Enum):
    """Company relationship status"""
    NEW = "new"
    WATCHING = "watching"
    CONTACTED = "contacted"
    ACTIVE_SUPPLIER = "active_supplier"
    INACTIVE = "inactive"


class ProductCategory(str, Enum):
    """iBood product categories"""
    CONSUMER_ELECTRONICS = "consumer_electronics"
    HOME_APPLIANCES = "home_appliances"
    HOME_LIVING = "home_living"
    GARDEN_OUTDOOR = "garden_outdoor"
    HEALTH_BEAUTY = "health_beauty"
    SPORTS_FITNESS = "sports_fitness"
    FASHION_ACCESSORIES = "fashion_accessories"
    DIY_TOOLS = "diy_tools"
    HOUSEHOLD_NONFOOD = "household_nonfood"


class SignalDefinition(TypedDict):
    """Signal type definition"""
    label: str
    priority: SignalPriority
    description: str
    why_matters: str
    keywords: list[str]
    urgency_days: int  # Days to act before opportunity expires


# Complete signal definitions from the spec
SIGNAL_DEFINITIONS: dict[SignalType, SignalDefinition] = {
    # HOT SIGNALS
    SignalType.INVENTORY_SURPLUS: {
        "label": "Inventory Surplus",
        "priority": SignalPriority.HOT,
        "description": "Company reports excess inventory, warehouse expansion, or inventory write-down",
        "why_matters": "Motivated to liquidate at discount",
        "keywords": ["excess inventory", "overstock", "inventory write-down", "surplus stock",
                    "warehouse clearance", "elevated inventory", "inventory levels"],
        "urgency_days": 14,
    },
    SignalType.EARNINGS_MISS: {
        "label": "Earnings Miss",
        "priority": SignalPriority.HOT,
        "description": "Quarterly results below expectations, revenue decline, profit warning",
        "why_matters": "Pressure to generate cash flow",
        "keywords": ["earnings miss", "profit warning", "revenue decline", "below expectations",
                    "disappointing results", "guidance cut", "restructuring"],
        "urgency_days": 21,
    },
    SignalType.PRODUCT_DISCONTINUATION: {
        "label": "Product Discontinuation",
        "priority": SignalPriority.HOT,
        "description": "SKU being phased out, model refresh announced",
        "why_matters": "Must clear old stock quickly",
        "keywords": ["discontinued", "phasing out", "end of life", "model refresh",
                    "product line cut", "last chance", "clearance"],
        "urgency_days": 30,
    },
    SignalType.WAREHOUSE_CLEARANCE: {
        "label": "Warehouse Clearance",
        "priority": SignalPriority.HOT,
        "description": "Facility closure, consolidation, or relocation announced",
        "why_matters": "Time pressure to move inventory",
        "keywords": ["warehouse closure", "facility consolidation", "distribution center",
                    "logistics restructuring", "moving warehouse"],
        "urgency_days": 30,
    },
    SignalType.LEADERSHIP_CHANGE: {
        "label": "CFO/CEO Change",
        "priority": SignalPriority.HOT,
        "description": "New financial leadership often clears balance sheet",
        "why_matters": "New management = fresh start",
        "keywords": ["new CEO", "new CFO", "leadership change", "executive appointment",
                    "management change", "new chief"],
        "urgency_days": 60,
    },
    SignalType.DEBT_PRESSURE: {
        "label": "Debt Pressure",
        "priority": SignalPriority.HOT,
        "description": "Credit rating downgrade, refinancing needs",
        "why_matters": "Need cash to meet obligations",
        "keywords": ["credit downgrade", "debt refinancing", "covenant breach",
                    "liquidity concerns", "financial distress"],
        "urgency_days": 30,
    },

    # STRATEGIC SIGNALS
    SignalType.EUROPEAN_MARKET_ENTRY: {
        "label": "European Market Entry",
        "priority": SignalPriority.STRATEGIC,
        "description": "Non-EU brand announcing EU expansion plans",
        "why_matters": "Need distribution partners, may offer favorable terms",
        "keywords": ["european expansion", "EU market entry", "entering europe",
                    "netherlands launch", "benelux expansion"],
        "urgency_days": 90,
    },
    SignalType.NEW_FACTORY: {
        "label": "New Factory Opening",
        "priority": SignalPriority.STRATEGIC,
        "description": "Production capacity increase, new manufacturing facility",
        "why_matters": "Overproduction likely in ramp-up phase",
        "keywords": ["new factory", "production facility", "manufacturing expansion",
                    "capacity increase", "plant opening"],
        "urgency_days": 120,
    },
    SignalType.PRODUCT_LAUNCH_OVERRUN: {
        "label": "Product Launch Overrun",
        "priority": SignalPriority.STRATEGIC,
        "description": "High initial production for new product launch",
        "why_matters": "Excess if sell-through lower than expected",
        "keywords": ["launch overrun", "initial production", "product launch",
                    "new product stock", "launch inventory"],
        "urgency_days": 60,
    },
    SignalType.SEASONAL_CLEARANCE: {
        "label": "Seasonal Clearance",
        "priority": SignalPriority.STRATEGIC,
        "description": "3-6 months before major selling season ends",
        "why_matters": "Post-season clearance opportunity",
        "keywords": ["seasonal", "end of season", "clearance sale", "winter clearance",
                    "summer clearance", "holiday stock"],
        "urgency_days": 45,
    },
    SignalType.RETAILER_DELISTING: {
        "label": "Retailer Delisting",
        "priority": SignalPriority.STRATEGIC,
        "description": "Major retailer dropping the brand",
        "why_matters": "Need alternative channels",
        "keywords": ["delisted", "dropped from", "no longer stocking", "removed from shelves",
                    "retailer exit"],
        "urgency_days": 60,
    },
    SignalType.DISTRIBUTION_CHANGE: {
        "label": "Distribution Change",
        "priority": SignalPriority.STRATEGIC,
        "description": "Changing distributors or going direct",
        "why_matters": "Transition creates deal opportunities",
        "keywords": ["new distributor", "distribution change", "going direct",
                    "channel restructuring", "distribution agreement"],
        "urgency_days": 90,
    },

    # MARKET SIGNALS
    SignalType.CATEGORY_OVERSUPPLY: {
        "label": "Category Oversupply",
        "priority": SignalPriority.MARKET,
        "description": "Industry-wide production exceeds demand",
        "why_matters": "Multiple suppliers may offer deals",
        "keywords": ["oversupply", "market surplus", "excess production",
                    "industry overcapacity", "supply glut"],
        "urgency_days": 90,
    },
    SignalType.RAW_MATERIAL_PRICE_DROP: {
        "label": "Raw Material Price Drop",
        "priority": SignalPriority.MARKET,
        "description": "Component costs decreasing significantly",
        "why_matters": "Margin pressure, room for discounts",
        "keywords": ["raw material", "component cost", "price drop", "commodity prices",
                    "input costs"],
        "urgency_days": 60,
    },
    SignalType.COMPETITOR_BANKRUPTCY: {
        "label": "Competitor Bankruptcy",
        "priority": SignalPriority.MARKET,
        "description": "Competitor in financial distress",
        "why_matters": "Their suppliers need new outlets",
        "keywords": ["bankruptcy", "insolvency", "administration", "liquidation",
                    "financial distress"],
        "urgency_days": 30,
    },
    SignalType.TRADE_POLICY_CHANGE: {
        "label": "Trade Policy Change",
        "priority": SignalPriority.MARKET,
        "description": "Tariffs, import restrictions changing",
        "why_matters": "May affect pricing and availability",
        "keywords": ["tariff", "trade policy", "import duty", "trade agreement",
                    "customs", "sanctions"],
        "urgency_days": 90,
    },
    SignalType.CURRENCY_SHIFT: {
        "label": "Currency Shift",
        "priority": SignalPriority.MARKET,
        "description": "Significant FX movement affecting exporters",
        "why_matters": "Creates pricing opportunities",
        "keywords": ["currency", "exchange rate", "forex", "dollar strength",
                    "euro weakness", "devaluation"],
        "urgency_days": 30,
    },
    SignalType.SHIPPING_COST_DROP: {
        "label": "Shipping Cost Drop",
        "priority": SignalPriority.MARKET,
        "description": "Logistics costs decreasing",
        "why_matters": "Improves landed cost economics",
        "keywords": ["shipping cost", "freight rates", "container prices",
                    "logistics cost", "transportation"],
        "urgency_days": 60,
    },

    # RELATIONSHIP SIGNALS
    SignalType.TRADE_SHOW_ATTENDANCE: {
        "label": "Trade Show Attendance",
        "priority": SignalPriority.RELATIONSHIP,
        "description": "Brand exhibiting at relevant trade show",
        "why_matters": "Opportunity to meet in person",
        "keywords": ["trade show", "exhibiting", "IFA", "CES", "Ambiente",
                    "trade fair", "exhibition"],
        "urgency_days": 90,
    },
    SignalType.NEW_PRODUCT_ANNOUNCEMENT: {
        "label": "New Product Announcement",
        "priority": SignalPriority.RELATIONSHIP,
        "description": "Launching products in iBood categories",
        "why_matters": "Potential future deal candidate",
        "keywords": ["new product", "product launch", "introducing", "unveils",
                    "announces new", "latest"],
        "urgency_days": 90,
    },
    SignalType.SUSTAINABILITY_INITIATIVE: {
        "label": "Sustainability Initiative",
        "priority": SignalPriority.RELATIONSHIP,
        "description": "Brand launching eco-friendly line",
        "why_matters": "Growing consumer demand",
        "keywords": ["sustainability", "eco-friendly", "green", "carbon neutral",
                    "recycled", "environmental"],
        "urgency_days": 120,
    },
    SignalType.AWARD_RECOGNITION: {
        "label": "Award Recognition",
        "priority": SignalPriority.RELATIONSHIP,
        "description": "Brand winning industry award",
        "why_matters": "Quality validation for iBood customers",
        "keywords": ["award", "recognition", "winner", "best in class",
                    "innovation award", "design award"],
        "urgency_days": 120,
    },
    SignalType.NEW_SALES_LEADER: {
        "label": "New Sales Leader",
        "priority": SignalPriority.RELATIONSHIP,
        "description": "New sales/commercial director appointed",
        "why_matters": "Fresh contact opportunity",
        "keywords": ["sales director", "commercial director", "head of sales",
                    "VP sales", "chief commercial"],
        "urgency_days": 60,
    },
    SignalType.PARTNERSHIP_ANNOUNCEMENT: {
        "label": "Partnership Announcement",
        "priority": SignalPriority.RELATIONSHIP,
        "description": "Brand partnering with relevant company",
        "why_matters": "Network expansion",
        "keywords": ["partnership", "collaboration", "joint venture", "alliance",
                    "agreement", "teaming up"],
        "urgency_days": 90,
    },
}


# Category taxonomy with subcategories
CATEGORY_TAXONOMY: dict[ProductCategory, dict] = {
    ProductCategory.CONSUMER_ELECTRONICS: {
        "label": "Consumer Electronics",
        "subcategories": [
            "Smartphones & Tablets",
            "Laptops & Computers",
            "TVs & Home Cinema",
            "Audio (headphones, speakers, soundbars)",
            "Wearables (smartwatches, fitness trackers)",
            "Gaming (consoles, accessories)",
            "Cameras & Photography",
            "Smart Home (IoT devices, hubs)",
            "Accessories (cables, chargers, cases)",
        ],
        "keywords": ["electronics", "tech", "gadget", "device", "smart", "digital"],
    },
    ProductCategory.HOME_APPLIANCES: {
        "label": "Home Appliances",
        "subcategories": [
            "Kitchen (coffee machines, air fryers, blenders, food processors)",
            "Cleaning (vacuum cleaners, steam cleaners, robot vacuums)",
            "Climate (air conditioners, fans, heaters, air purifiers)",
            "Laundry (irons, steamers)",
            "Personal Care Appliances (hair dryers, shavers, trimmers)",
        ],
        "keywords": ["appliance", "kitchen", "cleaning", "vacuum", "coffee", "air"],
    },
    ProductCategory.HOME_LIVING: {
        "label": "Home & Living",
        "subcategories": [
            "Furniture (chairs, tables, storage)",
            "Lighting (lamps, smart bulbs)",
            "Bedding & Textiles",
            "Kitchen & Dining (cookware, tableware)",
            "Home Decor",
            "Storage & Organization",
        ],
        "keywords": ["furniture", "home", "decor", "living", "interior"],
    },
    ProductCategory.GARDEN_OUTDOOR: {
        "label": "Garden & Outdoor",
        "subcategories": [
            "Garden Tools (electric & manual)",
            "Outdoor Furniture",
            "BBQ & Outdoor Cooking",
            "Pools & Water Features",
            "Lighting & Solar",
            "Plants & Planters",
        ],
        "keywords": ["garden", "outdoor", "patio", "bbq", "lawn", "pool"],
    },
    ProductCategory.HEALTH_BEAUTY: {
        "label": "Health & Beauty",
        "subcategories": [
            "Skincare",
            "Haircare",
            "Cosmetics & Makeup",
            "Fragrances",
            "Personal Hygiene",
            "Wellness & Supplements",
            "Medical Devices (blood pressure, thermometers)",
        ],
        "keywords": ["beauty", "skincare", "cosmetic", "health", "wellness", "personal care"],
    },
    ProductCategory.SPORTS_FITNESS: {
        "label": "Sports & Fitness",
        "subcategories": [
            "Fitness Equipment",
            "Cycling",
            "Outdoor Sports",
            "Team Sports",
            "Swimming",
            "Winter Sports",
        ],
        "keywords": ["fitness", "sports", "exercise", "gym", "cycling", "training"],
    },
    ProductCategory.FASHION_ACCESSORIES: {
        "label": "Fashion & Accessories",
        "subcategories": [
            "Footwear",
            "Bags & Luggage",
            "Watches",
            "Jewelry",
            "Sunglasses",
            "Clothing",
        ],
        "keywords": ["fashion", "watch", "bag", "shoe", "accessory", "style"],
    },
    ProductCategory.DIY_TOOLS: {
        "label": "DIY & Tools",
        "subcategories": [
            "Power Tools",
            "Hand Tools",
            "Workwear & Safety",
            "Fasteners & Hardware",
            "Paint & Decorating",
        ],
        "keywords": ["tool", "diy", "power tool", "drill", "hardware", "workshop"],
    },
    ProductCategory.HOUSEHOLD_NONFOOD: {
        "label": "Household & Non-Food",
        "subcategories": [
            "Cleaning Products",
            "Laundry Products",
            "Paper Products",
            "Storage & Organization",
            "Pet Supplies",
        ],
        "keywords": ["household", "cleaning", "laundry", "pet", "storage"],
    },
}
