function normalizeCodeInput(value = '') {
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export class MissionValidator {
  static validate(mission, payload = {}) {
    if (!mission) {
      return {
        isValid: false,
        feedback: 'Không tìm thấy dữ liệu nhiệm vụ.',
      };
    }

    if (mission.type === 'code-fix') {
      return MissionValidator.validateCodeFix(mission, payload);
    }

    if (mission.type === 'mentor-quiz') {
      return MissionValidator.validateMentorQuiz(mission, payload);
    }

    return {
      isValid: false,
      feedback: 'Loại nhiệm vụ không hợp lệ.',
    };
  }

  static validateCodeFix(mission, { selectedOptionId = '', textInput = '' } = {}) {
    const cleanText = normalizeCodeInput(textInput);

    // 1. If user typed a direct code patch, check against acceptedTextInputs
    if (cleanText.length > 0 && Array.isArray(mission.acceptedTextInputs)) {
      const matchedText = mission.acceptedTextInputs.some(
        (candidate) => normalizeCodeInput(candidate) === cleanText
      );

      if (matchedText) {
        const correctOpt = mission.options.find((opt) => opt.isCorrect);
        return {
          isValid: true,
          feedback:
            correctOpt?.feedback ||
            'Chính xác! Bản vá code bạn nhập đã khắc phục hoàn toàn lỗi hệ thống.',
        };
      }
    }

    // 2. Check selected multiple-choice option
    if (selectedOptionId) {
      const chosen = mission.options.find((opt) => opt.id === selectedOptionId);
      if (!chosen) {
        return {
          isValid: false,
          feedback: 'Phương án đã chọn không hợp lệ. Vui lòng thử lại.',
        };
      }

      return {
        isValid: Boolean(chosen.isCorrect),
        feedback: chosen.feedback,
      };
    }

    if (cleanText.length > 0) {
      return {
        isValid: false,
        feedback:
          'Bản vá code vừa nhập chưa chính xác. Bạn hãy kiểm tra lại cú pháp hoặc chọn một phương án bên trên nhé!',
      };
    }

    return {
      isValid: false,
      feedback: 'Vui lòng chọn một phương án hoặc nhập câu lệnh sửa lỗi trước khi xác nhận.',
    };
  }

  static validateMentorQuiz(mission, { answers = {} } = {}) {
    const questions = mission.questions || [];
    if (questions.length === 0) {
      return {
        isValid: false,
        feedback: 'Dữ liệu câu hỏi đang trống.',
      };
    }

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const chosenId = answers[q.id];
      if (!chosenId) {
        return {
          isValid: false,
          feedback: `Vui lòng chọn đáp án cho Câu hỏi ${i + 1} trước khi gửi.`,
        };
      }

      const chosenOption = q.options.find((opt) => opt.id === chosenId);
      if (!chosenOption || !chosenOption.isCorrect) {
        return {
          isValid: false,
          feedback: `${mission.errorFeedback} (Kiểm tra lại Câu hỏi ${i + 1})`,
        };
      }
    }

    return {
      isValid: true,
      feedback: mission.successFeedback,
    };
  }
}

export default MissionValidator;

