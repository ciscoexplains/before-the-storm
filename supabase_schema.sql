-- Before the Storm for Ananda — Database Schema
-- Run this in Supabase SQL Editor if tables don't exist yet

-- ============================================
-- Table: emotional_capsules
-- ============================================
CREATE TABLE IF NOT EXISTS emotional_capsules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  stable_mood_rating integer NOT NULL CHECK (stable_mood_rating >= 1 AND stable_mood_rating <= 10),
  message text NOT NULL,
  reminder text,
  optional_audio_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE emotional_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own capsules"
  ON emotional_capsules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own capsules"
  ON emotional_capsules FOR SELECT
  USING (auth.uid() = user_id);

-- Julian needs to read Ananda's capsules
-- This policy allows any authenticated user to read all capsules 
-- (only Julian + Ananda have accounts, so this is safe)
CREATE POLICY "Julian can read all capsules"
  ON emotional_capsules FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- Table: support_messages (Messages from Julian)
-- Linked to specific storms via capsule_id
-- ============================================
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  capsule_id uuid REFERENCES emotional_capsules(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT 'Julian',
  message text NOT NULL,
  unlock_mood_threshold integer CHECK (unlock_mood_threshold >= 1 AND unlock_mood_threshold <= 10),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read support messages
CREATE POLICY "Authenticated users can read support messages"
  ON support_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Julian can insert support messages
CREATE POLICY "Julian can insert support messages"
  ON support_messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Migration: Add capsule_id to existing support_messages
-- Run this if the table already exists without capsule_id
-- ============================================
-- ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS capsule_id uuid REFERENCES emotional_capsules(id) ON DELETE CASCADE;

-- ============================================
-- Table: bottle_messages (I Want to Sail feature)
-- Happy messages in a bottle — anyone can write,
-- anyone can catch a random message to read.
-- ============================================
CREATE TABLE IF NOT EXISTS bottle_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  message text NOT NULL,
  mood_rating integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE bottle_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert their own bottles
CREATE POLICY "Users can insert their own bottle messages"
  ON bottle_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Any authenticated user can read all bottle messages (to catch a random bottle)
CREATE POLICY "Anyone can read bottle messages"
  ON bottle_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- Table: grounding_completions
-- Tracks when Ananda finishes a grounding exercise.
-- Each completion becomes a violet star on the
-- Constellation of Resilience map.
-- ============================================
CREATE TABLE IF NOT EXISTS grounding_completions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  mood_rating integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE grounding_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own grounding completions"
  ON grounding_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own grounding completions"
  ON grounding_completions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Table: consciousness_entries (Stream of Consciousness feature)
-- Raw unfiltered text typed by user + Gemini therapist analysis.
-- ⚠️  Run this in Supabase SQL Editor to create the table:
-- ============================================
CREATE TABLE IF NOT EXISTS consciousness_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  raw_text text NOT NULL,
  gemini_analysis text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE consciousness_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own consciousness entries"
  ON consciousness_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own consciousness entries"
  ON consciousness_entries FOR SELECT
  USING (auth.uid() = user_id);
