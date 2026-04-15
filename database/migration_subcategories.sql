-- ============================================================
-- JulieCosmetics — Database Migration: Add subcategories
-- Run this BEFORE seed_catalog.sql
-- ============================================================

USE julie_cosmetics;
SET NAMES utf8mb4;

-- Add parent_id for subcategory support
ALTER TABLE categories
  ADD COLUMN parent_id INT NULL AFTER category_id,
  ADD FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE CASCADE;
