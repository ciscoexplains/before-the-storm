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

-- ============================================
-- Table: support_messages (Message from Julian)
-- ============================================
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Only admins should insert support messages (manual via Supabase Dashboard)
