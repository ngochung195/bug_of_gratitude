-- ============================================================================
-- BUG OF GRATITUDE - SUPABASE DATABASE SCHEMA, RLS & 10 INITIAL WISHES
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
  is_approved BOOLEAN NOT NULL DEFAULT true,
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
-- 3. ROW LEVEL SECURITY (RLS) POLICIES (INSTANT SHARED SKY PUBLISHING)
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
DROP POLICY IF EXISTS "Public can insert gratitude messages to shared sky" ON public.gratitude_messages;
CREATE POLICY "Public can insert gratitude messages to shared sky"
  ON public.gratitude_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(btrim(mentor_name)) BETWEEN 1 AND 100
    AND char_length(btrim(message)) BETWEEN 1 AND 300
    AND (sender_name IS NULL OR char_length(btrim(sender_name)) <= 100)
  );

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
-- 4. SEED 10 INITIAL GRATITUDE MESSAGES FOR SHARED SKY
-- ----------------------------------------------------------------------------
INSERT INTO public.gratitude_messages (id, mentor_name, sender_name, message, is_anonymous, is_approved, created_at)
VALUES
  ('22222222-2222-4222-8222-222222222201', 'Anh Nhật', 'Minh Quân - C08', 'Cảm ơn anh Nhật đã luôn kiên nhẫn giải thích từng khái niệm khó và truyền lửa đam mê lập trình cho tụi em. Nhờ có anh mà những dòng code không còn khô khan nữa. Chúc anh 20/11 thật nhiều sức khỏe!', false, true, '2026-11-17T01:10:00Z'),
  ('22222222-2222-4222-8222-222222222202', 'Anh Luân', 'Hải Đăng', 'Em nhớ mãi những buổi tối trước ngày bảo vệ dự án, anh Luân vẫn tận tình ngồi cùng nhóm gỡ từng lỗi logic nhỏ. Cảm ơn người anh luôn hết lòng vì học viên!', false, true, '2026-11-17T01:25:00Z'),
  ('22222222-2222-4222-8222-222222222203', 'Thầy Cấn', 'Ngọc Ánh', 'Những bài giảng sâu sắc và sự nghiêm khắc đầy tâm huyết của thầy Cấn đã rèn cho tụi em tư duy vững vàng khi bước vào nghề. Nhân ngày 20/11, em kính chúc thầy luôn mạnh khỏe và hạnh phúc!', false, true, '2026-11-17T01:40:00Z'),
  ('22222222-2222-4222-8222-222222222204', 'Anh Tuấn Anh', NULL, 'Trên lớp là người thầy đáng kính, ngoài giờ học lại gần gũi như người anh lớn luôn lắng nghe học viên. Cảm ơn anh Tuấn Anh vì tất cả những bài học quý giá cả trong code lẫn cuộc sống!', true, true, '2026-11-17T02:00:00Z'),
  ('22222222-2222-4222-8222-222222222205', 'Anh Tùng', 'Hoàng Long', 'Mỗi lần bí thuật toán hay gặp bug khó, chỉ cần nghe anh Tùng gợi ý hướng tiếp cận là mọi thứ sáng tỏ ngay. Cảm ơn anh Tùng đã luôn đồng hành và tiếp thêm sự tự tin cho tụi em!', false, true, '2026-11-17T02:15:00Z'),
  ('22222222-2222-4222-8222-222222222206', 'Đội ngũ giảng viên', 'Tập thể học viên CodeGym', 'Lỗi lớn nhất không phải là lỗi trong code, mà là đôi khi chúng em quên nói lời cảm ơn. Nhân ngày 20/11, xin gửi ngàn lời tri ân chân thành nhất tới toàn thể Đội ngũ giảng viên!', false, true, '2026-11-17T02:35:00Z'),
  ('22222222-2222-4222-8222-222222222207', 'CodeGym', 'Khánh Linh', 'Cảm ơn mái nhà CodeGym đã tạo ra một môi trường học tập thực chiến, ấm áp và kỷ luật, nơi những người bắt đầu từ con số 0 như em có thể chạm tới ước mơ lập trình viên!', false, true, '2026-11-17T02:55:00Z'),
  ('22222222-2222-4222-8222-222222222208', 'Anh Nhật', NULL, 'Những buổi code review chi tiết của anh Nhật đã giúp em thay đổi hoàn toàn thói quen viết code cẩu thả. Cảm ơn anh vì sự tận tụy và luôn mong muốn học trò tiến bộ mỗi ngày!', true, true, '2026-11-17T03:15:00Z'),
  ('22222222-2222-4222-8222-222222222209', 'Anh Luân', 'Thanh Sơn', 'Từ một người từng sợ vòng lặp và mảng hai chiều, hôm nay em đã tự tay hoàn thành dự án đầu tiên nhờ sự chỉ dẫn từng bước của anh Luân. Chúc anh 20/11 ngập tràn niềm vui!', false, true, '2026-11-17T03:30:00Z'),
  ('22222222-2222-4222-8222-222222222210', 'Anh Tùng', 'Bảo Trâm', 'Cảm ơn anh Tùng vì những lời động viên đúng lúc mỗi khi tụi em áp lực vì deadline. Chúc anh luôn giữ mãi nụ cười ấm áp và ngọn lửa nhiệt huyết trên hành trình truyền nghề!', false, true, '2026-11-17T03:50:00Z')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. REALTIME CONFIGURATION
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
