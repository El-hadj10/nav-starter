# Constantes globales Luma

# Seuils IA
MIN_MARGIN_PCT = 15.0
MIN_PRODUCT_RATING = 4.2
MIN_REVIEW_COUNT = 20
PUBLISH_SCORE_THRESHOLD = 65
MAX_LEAD_TIME_DAYS = 15

# Statuts produits
STATUS_DRAFT = "draft"
STATUS_PUBLISHED = "published"
STATUS_ARCHIVED = "archived"

# Statuts commandes
ORDER_PENDING = "pending"
ORDER_PROCESSING = "processing"
ORDER_SHIPPED = "shipped"
ORDER_DELIVERED = "delivered"
ORDER_CANCELLED = "cancelled"

# Décisions IA
DECISION_PUBLISH = "PUBLISH"
DECISION_HOLD = "HOLD"
DECISION_REJECT = "REJECT"
DECISION_NEEDS_REVIEW = "NEEDS_REVIEW"

# Stratégies pricing
STRATEGY_MATCH = "MATCH"
STRATEGY_UNDERCUT = "UNDERCUT"
STRATEGY_PREMIUM = "PREMIUM"

# Sources supportées
SOURCES = ["amazon", "ebay", "aliexpress", "zalando"]
