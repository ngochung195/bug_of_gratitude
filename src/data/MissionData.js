export const MISSIONS = [
  {
    id: 'mission-01',
    order: 1,
    stationId: 'mission-station-1',
    code: 'BUG #001',
    title: 'MISSION 01 – THE FIRST LOOP',
    topic: 'Java For Loop',
    type: 'code-fix',
    story:
      'Module đếm tiến trình khởi tạo của phòng Lab đang bị treo. Đáng lẽ hệ thống phải in ra các số từ 0 đến 5 rồi dừng lại, nhưng giá trị biến đếm i lại giảm xuống âm vô tận.',
    codeSnippet: [
      'public class BootCounter {',
      '    public static void main(String[] args) {',
      '        for (int i = 0; i <= 5; i--) {',
      '            System.out.println(i);',
      '        }',
      '    }',
      '}',
    ],
    errorLine: 3,
    question: 'Hãy chọn hoặc nhập phương án sửa dòng số 3 để vòng lặp chạy đúng từ 0 đến 5:',
    inputPlaceholder: 'Hoặc nhập biểu thức bước nhảy (ví dụ: i++)',
    acceptedTextInputs: [
      'i++',
      '++i',
      'i += 1',
      'i = i + 1',
      'for (int i = 0; i <= 5; i++)',
      'for (int i = 0; i <= 5; i++) {',
    ],
    options: [
      {
        id: 'opt-a',
        label: 'for (int i = 0; i <= 5; i++) {',
        isCorrect: true,
        feedback:
          'Chính xác! Khi bắt đầu từ i = 0 và điều kiện dừng i <= 5, ta cần tăng biến đếm bằng i++ sau mỗi vòng lặp.',
      },
      {
        id: 'opt-b',
        label: 'for (int i = 0; i >= 5; i--) {',
        isCorrect: false,
        feedback:
          'Chưa đúng: Với i = 0, điều kiện i >= 5 sẽ sai ngay từ lần kiểm tra đầu tiên nên vòng lặp không chạy lần nào.',
      },
      {
        id: 'opt-c',
        label: 'for (int i = 5; i <= 5; i++) {',
        isCorrect: false,
        feedback:
          'Chưa đúng: Cách này chỉ in ra duy nhất số 5 chứ không duyệt từ 0 đến 5.',
      },
      {
        id: 'opt-d',
        label: 'for (int i = 0; i < 0; i--) {',
        isCorrect: false,
        feedback:
          'Chưa đúng: Điều kiện i < 0 bị sai ngay khi khởi tạo i = 0.',
      },
    ],
    mentorHint:
      'Mentor Bot C-2011: "Ở Trạm Alpha (BUG #001), hãy nhìn kỹ phần cập nhật biến đếm cuối lệnh for: i đang bắt đầu từ 0 để tiến tới 5 mà lại dùng i-- kìa!"',
  },
  {
    id: 'mission-02',
    order: 2,
    stationId: 'mission-station-2',
    code: 'BUG #002',
    name: 'NULL NIGHTMARE',
    title: 'MISSION 02 – NULL NIGHTMARE',
    topic: 'NullPointerException',
    type: 'code-fix',
    story:
      'Hệ thống định danh học viên đột ngột văng lỗi java.lang.NullPointerException ngay khi vừa truy vấn độ dài tên người dùng.',
    codeSnippet: [
      'public class StudentProfile {',
      '    public static void main(String[] args) {',
      '        String name = null;',
      '        System.out.println(name.length());',
      '    }',
      '}',
    ],
    errorLine: 4,
    question:
      'Nguyên nhân gốc rễ nào gây ra NullPointerException và cách khắc phục an toàn là gì?',
    inputPlaceholder: 'Hoặc nhập giá trị khởi tạo hợp lệ (ví dụ: String name = "CodeGym";)',
    acceptedTextInputs: [
      'if (name != null)',
      'name != null',
      'String name = "CodeGym";',
      'String name = "";',
    ],
    options: [
      {
        id: 'opt-a',
        label: 'Do hàm System.out.println() không nhận kiểu số nguyên trả về từ length().',
        isCorrect: false,
        feedback:
          'Chưa đúng: System.out.println() hoàn toàn in được giá trị kiểu int.',
      },
      {
        id: 'opt-b',
        label:
          'Biến name đang trỏ tới null; gọi name.length() sẽ gây lỗi. Cần khởi tạo giá trị hoặc kiểm tra if (name != null) trước.',
        isCorrect: true,
        feedback:
          'Chính xác! Gọi phương thức trên một tham chiếu null là nguyên nhân kinh điển gây ra NullPointerException trong Java.',
      },
      {
        id: 'opt-c',
        label: 'Trong Java, kiểu String phải gọi thuộc tính name.size thay vì name.length().',
        isCorrect: false,
        feedback:
          'Chưa đúng: String trong Java sử dụng phương thức .length() là hoàn toàn đúng cú pháp.',
      },
      {
        id: 'opt-d',
        label: 'Biến cục bộ name không được phép khai báo bên trong hàm main().',
        isCorrect: false,
        feedback:
          'Chưa đúng: Bạn hoàn toàn có thể khai báo biến String cục bộ trong hàm main().',
      },
    ],
    mentorHint:
      'Mentor Bot C-2011: "Ở Trạm Beta (BUG #002), biến name đang mang giá trị null. Điều gì sẽ xảy ra khi ta cố gọi một phương thức trên đối tượng chưa tồn tại?"',
  },
  {
    id: 'mission-03',
    order: 3,
    stationId: 'mission-station-3',
    code: 'BUG #003',
    title: 'MISSION 03 – INFINITE DEADLINE',
    topic: 'Infinite Loop',
    type: 'code-fix',
    story:
      'Tiến trình kiểm tra bài tập đang làm CPU quá tải 100%. Vòng lặp while in ra số 0 liên tục không bao giờ kết thúc.',
    codeSnippet: [
      'int count = 0;',
      '',
      'while (count < 5) {',
      '    System.out.println(count);',
      '    // TODO: Missing step here',
      '}',
    ],
    errorLine: 5,
    question:
      'Tại sao vòng lặp trên không thể kết thúc và cần bổ sung câu lệnh nào vào dòng 5?',
    inputPlaceholder: 'Hoặc nhập câu lệnh cần thêm (ví dụ: count++;)',
    acceptedTextInputs: ['count++;', 'count++', '++count;', '++count', 'count += 1;', 'count = count + 1;'],
    options: [
      {
        id: 'opt-a',
        label: 'Đổi điều kiện while (count < 5) thành while (count == 0).',
        isCorrect: false,
        feedback:
          'Chưa đúng: Nếu không thay đổi giá trị count thì while (count == 0) vẫn lặp vô hạn.',
      },
      {
        id: 'opt-b',
        label: 'Thêm câu lệnh count--; vào bên trong vòng lặp while.',
        isCorrect: false,
        feedback:
          'Chưa đúng: count-- sẽ làm count giảm xuống -1, -2... và luôn nhỏ hơn 5, dẫn đến lặp vô hạn.',
      },
      {
        id: 'opt-c',
        label:
          'Biến count không được tăng lên sau mỗi lần lặp nên count < 5 luôn đúng. Cần thêm count++; ở dòng 5.',
        isCorrect: true,
        feedback:
          'Chính xác! Bổ sung count++; giúp biến đếm tiến dần tới 5 và kết thúc vòng lặp đúng lúc.',
      },
      {
        id: 'opt-d',
        label: 'Xóa câu lệnh System.out.println(count); bên trong vòng lặp.',
        isCorrect: false,
        feedback:
          'Chưa đúng: Xóa lệnh in chỉ làm vòng lặp chạy ngầm vô hạn mà không thoát được.',
      },
    ],
    mentorHint:
      'Mentor Bot C-2011: "Ở Trạm Gamma (BUG #003), biến count khởi tạo bằng 0 nhưng bên trong thân while chưa có dòng nào làm thay đổi giá trị của count cả!"',
  },
  {
    id: 'mission-04',
    order: 4,
    stationId: 'mission-station-4',
    code: 'BUG #004',
    title: "MISSION 04 – THE MENTOR'S VOICE",
    topic: 'Những lời dạy quen thuộc của Mentor',
    type: 'mentor-quiz',
    story:
      'Trạm Terminal Delta lưu trữ bộ nhớ âm thanh của những buổi review code. Để mở khóa trạm cuối cùng, bạn cần thấu hiểu ý nghĩa thực sự đằng sau những câu nói quen thuộc của thầy cô và Mentor CodeGym.',
    questions: [
      {
        id: 'q1',
        quote:
          '"Em đã thử đặt breakpoint debug chưa, và em hãy giải thích tại sao em viết dòng code này như vậy?"',
        prompt: 'Khi Mentor hỏi câu này, điều thầy cô thực sự muốn rèn luyện cho bạn là gì?',
        options: [
          {
            id: 'q1-a',
            label:
              'Rèn tư duy tự tìm nguyên nhân gốc rễ (root cause) và hiểu rõ bản chất từng dòng code mình viết thay vì copy-paste.',
            isCorrect: true,
          },
          {
            id: 'q1-b',
            label: 'Muốn thử thách trí nhớ xem học viên có thuộc lòng cú pháp Java hay không.',
            isCorrect: false,
          },
          {
            id: 'q1-c',
            label: 'Vì IDE chỉ cho phép biên dịch chương trình sau khi đã bật chế độ Debugger.',
            isCorrect: false,
          },
        ],
      },
      {
        id: 'q2',
        quote: '"Đọc kỹ đề bài nhé. Code chạy được chưa có nghĩa là code đúng đâu!"',
        prompt: 'Lời nhắc nhở tâm huyết này giúp lập trình viên tránh được sai lầm nào?',
        options: [
          {
            id: 'q2-a',
            label: 'Chỉ cần code không báo lỗi cú pháp đỏ trên màn hình là có thể đem đi nộp ngay.',
            isCorrect: false,
          },
          {
            id: 'q2-b',
            label:
              'Tránh chủ quan khi mới chạy qua trường hợp cơ bản; cần kiểm tra kỹ yêu cầu nghiệp vụ, edge cases và chất lượng clean code.',
            isCorrect: true,
          },
          {
            id: 'q2-c',
            label: 'Không nên chạy thử chương trình trước khi viết xong toàn bộ dự án.',
            isCorrect: false,
          },
        ],
      },
    ],
    successFeedback:
      'Tuyệt vời! Đằng sau mỗi câu hỏi nghiêm khắc của thầy cô và Mentor là sự kiên nhẫn rèn giũa tư duy vững vàng cho bạn.',
    errorFeedback:
      'Hãy suy ngẫm lại một chút về tâm ý của thầy cô trong những giờ hướng dẫn debug nhé!',
    mentorHint:
      'Mentor Bot C-2011: "Ở Trạm Delta (BUG #004), hãy nhớ lại những buổi ngồi cùng giảng viên và mentor: họ không chỉ sửa hộ bạn một dòng code, mà đang trao cho bạn phương pháp tự đứng vững!"',
  },
];
