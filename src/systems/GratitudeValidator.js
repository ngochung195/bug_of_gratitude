import { APP_CONFIG } from '../config/constants.js';

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class GratitudeValidator {
  static validate({
    mentorName = '',
    senderName = '',
    message = '',
    isAnonymous = false,
  } = {}) {
    const trimmedMentor = String(mentorName ?? '').trim();
    const trimmedSender = String(senderName ?? '').trim();
    const trimmedMessage = String(message ?? '').trim();
    const anonymousFlag = Boolean(isAnonymous);
    const maxLen = APP_CONFIG.GRATITUDE_MAX_LENGTH || 300;

    const errors = {};

    if (!trimmedMentor) {
      errors.mentorName =
        'Vui lòng nhập tên Giảng viên, Mentor hoặc người bạn muốn gửi lời cảm ơn.';
    }

    if (!trimmedMessage) {
      errors.message =
        'Nội dung lời cảm ơn không được để trống hoặc chỉ chứa khoảng trắng.';
    } else if (trimmedMessage.length > maxLen) {
      errors.message = `Nội dung lời cảm ơn không được vượt quá ${maxLen} ký tự (hiện tại: ${trimmedMessage.length}/${maxLen}).`;
    }

    const isValid = Object.keys(errors).length === 0;

    return {
      isValid,
      errors,
      firstErrorMessage:
        errors.mentorName || errors.message || '',
      sanitized: {
        mentorName: trimmedMentor,
        senderName: trimmedSender,
        message: trimmedMessage,
        isAnonymous: anonymousFlag,
      },
    };
  }

  static createLetterObject(rawInput = {}) {
    const validation = GratitudeValidator.validate(rawInput);
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors,
        firstErrorMessage: validation.firstErrorMessage,
        letter: null,
      };
    }

    const { mentorName, senderName, message, isAnonymous } = validation.sanitized;

    const letter = {
      id: generateUUID(),
      mentorName,
      senderName: isAnonymous ? 'Anonymous' : senderName || 'Anonymous',
      message,
      isAnonymous: Boolean(isAnonymous || !senderName),
      createdAt: new Date().toISOString(),
    };

    return {
      isValid: true,
      errors: {},
      firstErrorMessage: '',
      letter,
    };
  }

  static formatPublicSender({ senderName = '', isAnonymous = false } = {}) {
    if (isAnonymous) {
      return 'Anonymous (Ẩn danh)';
    }
    const clean = String(senderName ?? '').trim();
    return clean || 'Anonymous (Ẩn danh)';
  }
}

export default GratitudeValidator;

