-- ============================================================
-- Luma — Schéma SQL initial
-- PostgreSQL 15+
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Table : products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(255) UNIQUE NOT NULL,
    source_id   VARCHAR(255) NOT NULL,
    source      VARCHAR(50)  NOT NULL,     -- amazon | ebay | aliexpress
    title       VARCHAR(500) NOT NULL,
    brand       VARCHAR(255),
    category    VARCHAR(255) NOT NULL,
    attributes  JSONB        DEFAULT '{}',
    status      VARCHAR(50)  DEFAULT 'draft', -- draft | published | archived
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- Table : offers (prix/stock source)
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
    supplier      VARCHAR(100) NOT NULL,
    source_price  NUMERIC(10,2) NOT NULL,
    shipping_cost NUMERIC(10,2) DEFAULT 0,
    stock         INTEGER       DEFAULT 0,
    lead_time_days INTEGER      DEFAULT 7,
    affiliate_url TEXT,
    updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- Table : listings (configuration vitrine)
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID REFERENCES products(id) ON DELETE CASCADE,
    sale_price        NUMERIC(10,2) NOT NULL,
    margin_pct        NUMERIC(5,2),
    seo_score         INTEGER DEFAULT 0,
    title             VARCHAR(500),
    meta_description  VARCHAR(160),
    short_description TEXT,
    long_description  TEXT,
    bullets           JSONB DEFAULT '[]',
    images            JSONB DEFAULT '[]',
    published_at      TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table : orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id                UUID NOT NULL,
    stripe_payment_intent_id   VARCHAR(255) UNIQUE,
    paid_amount                NUMERIC(10,2) NOT NULL,
    commission_amount          NUMERIC(10,2) DEFAULT 0,
    status                     VARCHAR(50) DEFAULT 'pending',
    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table : order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID REFERENCES products(id),
    qty         INTEGER NOT NULL DEFAULT 1,
    unit_price  NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- Table : commission_ledger
-- ============================================================
CREATE TABLE IF NOT EXISTS commission_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id),
    source_network  VARCHAR(100),
    gross           NUMERIC(10,2),
    fees            NUMERIC(10,2) DEFAULT 0,
    net             NUMERIC(10,2),
    payout_status   VARCHAR(50) DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table : agent_logs (audit trail IA)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name  VARCHAR(100) NOT NULL,
    input_hash  VARCHAR(64),
    decision    VARCHAR(100),
    confidence  NUMERIC(4,3),
    payload     JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index sur les colonnes fréquemment requêtées
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_product ON listings(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_name, created_at DESC);
