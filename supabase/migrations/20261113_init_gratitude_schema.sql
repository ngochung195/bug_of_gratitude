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
  ('11111111-1111-4111-8111-111111111101', 'Thầy Nguyễn Khắc Nhật', 'Minh Quân - C08', 'Cảm ơn thầy đã luôn kiên nhẫn giải thích từng khái niệm OOP và cấu trúc dữ liệu cho tụi em. Nhờ thầy mà em không còn sợ những dòng log đỏ rực nữa. Chúc thầy 20/11 thật nhiều sức khỏe!', false, true, '2026-11-16T14:20:00Z'),
  ('11111111-1111-4111-8111-111111111102', 'Mentor Trần Quốc Tuấn', 'Hải Đăng', 'Em nhớ mãi buổi tối trước ngày bảo vệ dự án, anh vẫn thức cùng nhóm tới 11h đêm để tìm ra lỗi NullPointerException. Cảm ơn người anh, người thầy tận tâm nhất của tụi em!', false, true, '2026-11-16T15:10:00Z'),
  ('11111111-1111-4111-8111-111111111103', 'Cô Lê Thị Thu Lan', NULL, 'Những lúc em nản chí nhất vì chuyển ngành học code từ con số 0, chính lời động viên ấm áp của cô đã giữ em ở lại với nghề. Cảm ơn cô vì luôn tin tưởng học viên!', true, true, '2026-11-16T16:05:00Z'),
  ('11111111-1111-4111-8111-111111111104', 'Mentor Phạm Hoàng Khoa', 'Ngọc Ánh - Java Web', 'Câu nói "Em đã đọc kỹ thông báo lỗi ở dòng số mấy chưa?" của anh đã rèn cho em thói quen tự tư duy và debug bình tĩnh hơn rất nhiều. Tri ân anh nhân ngày 20/11!', false, true, '2026-11-16T17:30:00Z'),
  ('11111111-1111-4111-8111-111111111105', 'Thầy Đỗ Văn Hùng', 'Tập thể lớp C06', 'Thầy không chỉ dạy tụi em cách viết code sạch mà còn dạy thái độ trách nhiệm với từng sản phẩm mình làm ra. Chúc thầy luôn giữ mãi ngọn lửa nhiệt huyết trên giảng đường CodeGym!', false, true, '2026-11-16T18:45:00Z'),
  ('11111111-1111-4111-8111-111111111106', 'Cô Vũ Mai Hương', 'Hoàng Long', 'Cảm ơn cô giáo vụ và giảng viên đã luôn đồng hành, nhắc nhở từng bài tập nhỏ và tiếp thêm động lực cho cả lớp mỗi sáng đến trung tâm. Chúc cô 20/11 ngập tràn niềm vui!', false, true, '2026-11-16T19:20:00Z'),
  ('11111111-1111-4111-8111-111111111107', 'Mentor Nguyễn Đức Nam', NULL, 'Từ một người từng sợ vòng lặp for và mảng 2 chiều, hôm nay em đã tự tay hoàn thành project đầu tiên nhờ sự chỉ dẫn tận tình của anh. Cảm ơn anh Nam thật nhiều!', true, true, '2026-11-16T20:15:00Z'),
  ('11111111-1111-4111-8111-111111111108', 'Thầy Bùi Minh Đức', 'Thanh Tùng', 'Mỗi buổi code review của thầy đều là một bài học quý giá giúp em trưởng thành hơn. Cảm ơn thầy vì sự nghiêm khắc nhưng đầy yêu thương dành cho học trò!', false, true, '2026-11-16T21:00:00Z'),
  ('11111111-1111-4111-8111-111111111109', 'Mentor Lê Bảo Trâm', 'Khánh Linh', 'Cảm ơn chị Trâm đã truyền cảm hứng cho em tự tin theo đuổi con đường Frontend Developer. Những góp ý tỉ mỉ về UI/UX của chị luôn là kim chỉ nam của em!', false, true, '2026-11-17T02:30:00Z'),
  ('11111111-1111-4111-8111-111111111110', 'Đội ngũ Giảng viên & Mentor CodeGym', 'Học viên khóa 2026', 'Lỗi lớn nhất không phải là lỗi trong code, mà là đôi khi chúng em quên nói lời cảm ơn. Nhân ngày Nhà giáo Việt Nam 20/11, xin gửi ngàn lời tri ân chân thành nhất tới các Thầy Cô!', false, true, '2026-11-17T03:45:00Z')
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
