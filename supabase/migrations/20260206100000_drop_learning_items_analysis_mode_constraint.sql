-- Migration: Drop analysis_mode constraint from learning_items
-- Purpose: Allow analysis_mode values to evolve without DB constraint
-- Date: 2026-02-06

alter table public.learning_items
  drop constraint if exists check_analysis_mode;
