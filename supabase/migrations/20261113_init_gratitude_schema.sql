-- ============================================================================
-- BUG OF GRATITUDE - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (PHASE 6)
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLE: gratitude_messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gratitude_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_name VARCHAR(100) NOT NULL,
  sender_name VARCHAR(100) NULL,
  message VARCHAR(300) NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Server-side input validation constraints
  CONSTRAINT chk_mentor_name_non_empty
    CHECK (char_length(btrim(mentor_name)) BETWEEN 1 AND 100),
  CONSTRAINT chk_sender_name_length
    CHECK (sender_name IS NULL OR char_length(btrim(sender_name)) <= 100),
  CONSTRAINT chk_message_non_empty_and_max_300
    CHECK (char_length(btrim(message)) BETWEEN 1 AND 300)
);

CREATE INDEX IF NOT EXISTS idx_gratitude_messages_approved_created
  ON public.gratitude_messages (is_approved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gratitude_messages_mentor_search
  ON public.gratitude_messages (mentor_name);

-- ----------------------------------------------------------------------------
-- 2. TABLE: gratitude_reactions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gratitude_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.gratitude_messages(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL DEFAULT 'heart',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_reaction_type_allowed
    CHECK (reaction_type IN ('heart'))
);

CREATE INDEX IF NOT EXISTS idx_gratitude_reactions_message_id
  ON public.gratitude_reactions (message_id);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.gratitude_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratitude_reactions ENABLE ROW LEVEL SECURITY;

-- 3.1. Policies for gratitude_messages
DROP POLICY IF EXISTS "Public can read only approved gratitude messages" ON public.gratitude_messages;
CREATE POLICY "Public can read only approved gratitude messages"
  ON public.gratitude_messages
  FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

DROP POLICY IF EXISTS "Public can insert unapproved gratitude messages only" ON public.gratitude_messages;
CREATE POLICY "Public can insert unapproved gratitude messages only"
  ON public.gratitude_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_approved = false
    AND char_length(btrim(mentor_name)) BETWEEN 1 AND 100
    AND char_length(btrim(message)) BETWEEN 1 AND 300
    AND (sender_name IS NULL OR char_length(btrim(sender_name)) <= 100)
  );

-- Note: No UPDATE or DELETE policies are granted to anon/authenticated roles.
-- Only administrators via Supabase Dashboard or service_role on a trusted backend
-- can approve (set is_approved = true) or delete messages.

-- 3.2. Policies for gratitude_reactions
DROP POLICY IF EXISTS "Public can read reactions for approved messages" ON public.gratitude_reactions;
CREATE POLICY "Public can read reactions for approved messages"
  ON public.gratitude_reactions
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.gratitude_messages m
      WHERE m.id = gratitude_reactions.message_id
        AND m.is_approved = true
    )
  );

DROP POLICY IF EXISTS "Public can insert heart reactions for approved messages" ON public.gratitude_reactions;
CREATE POLICY "Public can insert heart reactions for approved messages"
  ON public.gratitude_reactions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    reaction_type = 'heart'
    AND EXISTS (
      SELECT 1
      FROM public.gratitude_messages m
      WHERE m.id = gratitude_reactions.message_id
        AND m.is_approved = true
    )
  );

-- ----------------------------------------------------------------------------
-- 4. REALTIME CONFIGURATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'gratitude_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gratitude_messages;
  END IF;
END $$;
