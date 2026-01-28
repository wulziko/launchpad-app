-- LaunchPad Migration: Add n8n Workflow Fields
-- Run this in Supabase SQL Editor AFTER the initial schema

-- ===========================================
-- ADD NEW COLUMNS TO PRODUCTS TABLE
-- ===========================================

-- Language for content generation (English, Hebrew, etc.)
ALTER TABLE products ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';

-- Country for targeting (more specific than market)
ALTER TABLE products ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Amazon product link (for research)
ALTER TABLE products ADD COLUMN IF NOT EXISTS amazon_link TEXT;

-- Competitor links for research
ALTER TABLE products ADD COLUMN IF NOT EXISTS competitor_link_1 TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS competitor_link_2 TEXT;

-- Target gender (Male, Female, All)
ALTER TABLE products ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'All';

-- Product image URL (for banner generation)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_image_url TEXT;

-- ===========================================
-- ADD INDEXES FOR NEW COLUMNS (optional but good for performance)
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_products_language ON products(language);
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);

-- ===========================================
-- DONE!
-- ===========================================
-- New fields added:
-- ✅ language - Content language (English, Hebrew, etc.)
-- ✅ country - Target country
-- ✅ amazon_link - Amazon product URL
-- ✅ competitor_link_1 - First competitor URL
-- ✅ competitor_link_2 - Second competitor URL  
-- ✅ gender - Target gender (Male, Female, All)
-- ✅ product_image_url - Product image for banner gen
