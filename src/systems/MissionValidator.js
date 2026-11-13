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
        isEmptyInput: true,
        wrongOptionIds: [],
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
      isEmptyInput: true,
      wrongOptionIds: [],
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
          isEmptyInput: false,
          wrongOptionIds: [],
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
          isEmptyInput: true,
          wrongOptionIds: [],
          feedback: 'Phương án đã chọn không hợp lệ. Vui lòng thử lại.',
        };
      }

      return {
        isValid: Boolean(chosen.isCorrect),
        isEmptyInput: false,
        wrongOptionIds: chosen.isCorrect ? [] : [chosen.id],
        feedback: chosen.feedback,
      };
    }

    if (cleanText.length > 0) {
      return {
        isValid: false,
        isEmptyInput: false,
        wrongOptionIds: [],
        feedback:
          'ĐÁP ÁN SAI: Bản vá code vừa nhập chưa chính xác. Bạn hãy kiểm tra lại cú pháp hoặc chọn một phương án bên trên nhé!',
      };
    }

    return {
      isValid: false,
      isEmptyInput: true,
      wrongOptionIds: [],
      feedback: 'Vui lòng chọn một đáp án hoặc nhập câu lệnh sửa lỗi trước khi xác nhận.',
    };
  }

  static validateMentorQuiz(mission, { answers = {} } = {}) {
    const questions = mission.questions || [];
    if (questions.length === 0) {
      return {
        isValid: false,
        isEmptyInput: true,
        wrongOptionIds: [],
        feedback: 'Dữ liệu câu hỏi đang trống.',
      };
    }

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!answers[q.id]) {
        return {
          isValid: false,
          isEmptyInput: true,
          wrongOptionIds: [],
          feedback: `Vui lòng chọn đáp án cho Câu hỏi ${i + 1} trước khi gửi.`,
        };
      }
    }

    const wrongOptionIds = [];
    const wrongQuestionNumbers = [];

    questions.forEach((q, idx) => {
      const chosenId = answers[q.id];
      const chosenOption = q.options.find((opt) => opt.id === chosenId);
      if (!chosenOption || !chosenOption.isCorrect) {
        wrongOptionIds.push(chosenId);
        wrongQuestionNumbers.push(idx + 1);
      }
    });

    if (wrongOptionIds.length > 0) {
      return {
        isValid: false,
        isEmptyInput: false,
        wrongOptionIds,
        feedback: `ĐÁP ÁN CHƯA ĐÚNG ở Câu ${wrongQuestionNumbers.join(', ')}: ${mission.errorFeedback}`,
      };
    }

    return {
      isValid: true,
      isEmptyInput: false,
      wrongOptionIds: [],
      feedback: mission.successFeedback,
    };
  }
}

export default MissionValidator;
