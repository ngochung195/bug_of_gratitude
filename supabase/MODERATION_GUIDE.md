# HƯỚNG DẪN THIẾT LẬP SUPABASE & DUYỆT LỜI CẢM ƠN (MODERATION GUIDE)

Tài liệu này hướng dẫn cách khởi tạo Database, cấu hình biến môi trường và quy trình duyệt lời cảm ơn (`is_approved`) an toàn cho dự án **BUG OF GRATITUDE**.

---

## 1. Chạy Migration tạo bảng & RLS

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard) và chọn Project của bạn.
2. Mở mục **SQL Editor** $\rightarrow$ nhấn **New query**.
3. Copy toàn bộ nội dung file [`supabase/migrations/20261113_init_gratitude_schema.sql`](./migrations/20261113_init_gratitude_schema.sql) dán vào trình soạn thảo và nhấn **Run**.
4. Hệ thống sẽ tạo:
   - Bảng `public.gratitude_messages` (lưu lời cảm ơn, mặc định `is_approved = false`).
   - Bảng `public.gratitude_reactions` (lưu lượt thả tim `heart`).
   - Toàn bộ chính sách **Row Level Security (RLS)** đảm bảo:
     - Người chơi chỉ đọc được thư đã duyệt (`is_approved = true`).
     - Người chơi khi gửi thư mới bắt buộc `is_approved = false` (không thể tự truyền `is_approved = true`).
     - Không ai có quyền dùng `anon` key để tự `UPDATE` trạng thái `is_approved`.

---

## 2. Cấu hình Biến môi trường (`.env`)

1. Tại thư mục gốc của dự án, tạo file `.env` (sao chép từ `.env.example`):
   ```env
   VITE_APP_TITLE="BUG OF GRATITUDE"
   VITE_APP_VERSION="0.1.0"
   VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
   VITE_SUPABASE_ANON_KEY="<your-anon-public-key>"
   ```
2. Lấy thông tin trong Supabase Dashboard tại **Project Settings $\rightarrow$ API**:
   - **Project URL** $\rightarrow$ điền vào `VITE_SUPABASE_URL`.
   - **Project API Keys $\rightarrow$ `anon` `public`** $\rightarrow$ điền vào `VITE_SUPABASE_ANON_KEY`.
   - **Tuyệt đối KHÔNG** sử dụng `service_role` key ở phía frontend.

---

## 3. Quy trình Duyệt Lời Cảm Ơn (Moderation Workflow)

Vì lý do bảo mật, mọi lời cảm ơn do người chơi gửi lên đều có trạng thái mặc định `is_approved = false`. Ban tổ chức / Quản trị viên có thể duyệt lời cảm ơn theo 2 cách an toàn trên Supabase Dashboard:

### Cách 1: Duyệt trực quan qua Table Editor
1. Vào **Table Editor** $\rightarrow$ chọn bảng `gratitude_messages`.
2. Lọc các thư mới gửi (`is_approved` = `false`).
3. Kiểm tra nội dung văn minh, hợp lệ $\rightarrow$ tích chọn ô `is_approved = true` và nhấn **Save**.
4. Ngay khi lưu, nhờ Supabase Realtime, lời cảm ơn vừa duyệt sẽ xuất hiện tức thì trên màn hình của tất cả người chơi đang mở ứng dụng.

### Cách 2: Duyệt nhanh qua SQL Editor
Chạy câu lệnh sau trong **SQL Editor** (chạy với quyền Admin trên Dashboard):

```sql
-- Xem danh sách các lời cảm ơn đang chờ duyệt
SELECT id, mentor_name, sender_name, message, is_anonymous, created_at
FROM public.gratitude_messages
WHERE is_approved = false
ORDER BY created_at DESC;

-- Duyệt một lời cảm ơn cụ thể theo ID
UPDATE public.gratitude_messages
SET is_approved = true
WHERE id = 'nhập-uuid-của-lời-cảm-ơn';
```

