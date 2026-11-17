import { GUIDING_LETTER_PARAGRAPHS } from '../data/guidingLetterData.js';

export class GuidingLetterTypewriter {
  constructor({
    paragraphs = GUIDING_LETTER_PARAGRAPHS,
    charDelayMs = 34,
    paragraphPauseMs = 1200,
    reducedMotion = false,
    onUpdate,
    onParagraphStart,
    onParagraphComplete,
    onClosingReached,
    onTypeTick,
    onAllComplete,
  } = {}) {
    this.paragraphs = Array.isArray(paragraphs) ? paragraphs : [];
    this.charDelayMs = Math.max(10, Number(charDelayMs) || 34);
    this.paragraphPauseMs = Math.max(50, Number(paragraphPauseMs) || 1200);
    this.reducedMotion = Boolean(reducedMotion);

    this.onUpdate = typeof onUpdate === 'function' ? onUpdate : null;
    this.onParagraphStart =
      typeof onParagraphStart === 'function' ? onParagraphStart : null;
    this.onParagraphComplete =
      typeof onParagraphComplete === 'function' ? onParagraphComplete : null;
    this.onClosingReached =
      typeof onClosingReached === 'function' ? onClosingReached : null;
    this.onTypeTick = typeof onTypeTick === 'function' ? onTypeTick : null;
    this.onAllComplete = typeof onAllComplete === 'function' ? onAllComplete : null;

    this.currentParagraphIndex = -1;
    this.currentCharIndex = 0;
    this.completedTexts = [];
    this.isHeaderVisible = false;
    this.isTypingParagraph = false;
    this.isWaitingBetweenParagraphs = false;
    this.isAllCompleted = false;
    this.closingNotified = false;
    this.timerId = null;
  }

  getState() {
    const activePara =
      this.currentParagraphIndex >= 0 &&
      this.currentParagraphIndex < this.paragraphs.length
        ? this.paragraphs[this.currentParagraphIndex]
        : null;

    const activeFullText = String(activePara?.text || '');
    const activeDisplayedText = this.isAllCompleted
      ? activeFullText
      : activeFullText.slice(0, this.currentCharIndex);

    const renderedParagraphs = this.paragraphs.map((para, idx) => {
      if (this.isAllCompleted || idx < this.currentParagraphIndex) {
        return {
          ...para,
          visible: true,
          displayedText: para.text,
          isTyping: false,
          hasCursor: false,
          isDone: true,
        };
      }
      if (idx === this.currentParagraphIndex) {
        return {
          ...para,
          visible: true,
          displayedText: activeDisplayedText,
          isTyping: this.isTypingParagraph,
          hasCursor: !this.isAllCompleted,
          isDone: !this.isTypingParagraph,
        };
      }
      return {
        ...para,
        visible: false,
        displayedText: '',
        isTyping: false,
        hasCursor: false,
        isDone: false,
      };
    });

    return {
      isHeaderVisible: this.isHeaderVisible,
      currentParagraphIndex: this.currentParagraphIndex,
      totalParagraphs: this.paragraphs.length,
      isTypingParagraph: this.isTypingParagraph,
      isWaitingBetweenParagraphs: this.isWaitingBetweenParagraphs,
      isAllCompleted: this.isAllCompleted,
      renderedParagraphs,
    };
  }

  start(initialDelayMs = 350) {
    this.clearTimer();
    this.isHeaderVisible = true;
    this.currentParagraphIndex = -1;
    this.currentCharIndex = 0;
    this.isTypingParagraph = false;
    this.isWaitingBetweenParagraphs = false;
    this.isAllCompleted = false;
    this.closingNotified = false;

    this.emitUpdate();

    if (this.paragraphs.length === 0) {
      this.finishAll();
      return;
    }

    if (this.reducedMotion) {
      this.skipAll();
      return;
    }

    this.scheduleTimer(() => {
      this.startParagraph(0);
    }, initialDelayMs);
  }

  startParagraph(index) {
    this.clearTimer();
    if (index >= this.paragraphs.length) {
      this.finishAll();
      return;
    }

    this.currentParagraphIndex = index;
    this.currentCharIndex = 0;
    this.isTypingParagraph = true;
    this.isWaitingBetweenParagraphs = false;

    const para = this.paragraphs[index];
    if (para?.isClosing && !this.closingNotified) {
      this.closingNotified = true;
      if (this.onClosingReached) {
        this.onClosingReached(para);
      }
    }

    if (this.onParagraphStart) {
      this.onParagraphStart(index, para, this.getState());
    }

    this.emitUpdate();
    this.scheduleNextChar();
  }

  scheduleNextChar() {
    this.clearTimer();
    this.scheduleTimer(() => {
      this.stepChar();
    }, this.charDelayMs);
  }

  stepChar() {
    if (this.isAllCompleted || !this.isTypingParagraph) return;

    const para = this.paragraphs[this.currentParagraphIndex];
    if (!para) {
      this.finishAll();
      return;
    }

    const fullText = String(para.text || '');
    if (this.currentCharIndex < fullText.length) {
      this.currentCharIndex += 1;
      const ch = fullText[this.currentCharIndex - 1];

      // Subtle sound tick every 5 visible characters
      if (this.onTypeTick && ch && ch.trim() && this.currentCharIndex % 5 === 1) {
        this.onTypeTick(ch, this.currentParagraphIndex);
      }

      if (this.currentCharIndex >= fullText.length) {
        this.onCurrentParagraphFinishedTyping(this.paragraphPauseMs);
      } else {
        this.emitUpdate();
        this.scheduleNextChar();
      }
    } else {
      this.onCurrentParagraphFinishedTyping(this.paragraphPauseMs);
    }
  }

  onCurrentParagraphFinishedTyping(pauseDurationMs) {
    this.clearTimer();
    this.isTypingParagraph = false;

    const para = this.paragraphs[this.currentParagraphIndex];
    if (this.onParagraphComplete) {
      this.onParagraphComplete(this.currentParagraphIndex, para, this.getState());
    }

    if (this.currentParagraphIndex >= this.paragraphs.length - 1) {
      this.finishAll();
      return;
    }

    this.isWaitingBetweenParagraphs = true;
    this.emitUpdate();

    this.scheduleTimer(() => {
      this.isWaitingBetweenParagraphs = false;
      this.startParagraph(this.currentParagraphIndex + 1);
    }, pauseDurationMs);
  }

  /**
   * Triggered by CLICK or SPACE:
   * - If a paragraph is currently being typed, reveals the entire current paragraph immediately
   *   and pauses briefly before starting the next paragraph (does NOT skip remaining paragraphs!).
   * - If waiting in the inter-paragraph pause, immediately starts the next paragraph.
   */
  completeCurrentParagraph() {
    if (this.isAllCompleted) {
      return this.getState();
    }

    // If still in initial header delay before paragraph 0 starts
    if (this.currentParagraphIndex < 0) {
      this.startParagraph(0);
      return this.getState();
    }

    if (this.isTypingParagraph) {
      const para = this.paragraphs[this.currentParagraphIndex];
      this.currentCharIndex = String(para?.text || '').length;
      this.onCurrentParagraphFinishedTyping(Math.min(320, this.paragraphPauseMs));
      return this.getState();
    }

    if (this.isWaitingBetweenParagraphs) {
      this.isWaitingBetweenParagraphs = false;
      this.startParagraph(this.currentParagraphIndex + 1);
      return this.getState();
    }

    return this.getState();
  }

  /**
   * Triggered by SKIP button:
   * - Immediately displays all paragraphs and the closing block.
   * - Marks `isAllCompleted = true` so the CONTINUE button appears (does not skip the final dissolve transition).
   */
  skipAll() {
    this.clearTimer();
    this.isHeaderVisible = true;
    this.currentParagraphIndex = Math.max(0, this.paragraphs.length - 1);
    const lastPara = this.paragraphs[this.currentParagraphIndex];
    this.currentCharIndex = String(lastPara?.text || '').length;
    this.isTypingParagraph = false;
    this.isWaitingBetweenParagraphs = false;

    if (lastPara?.isClosing && !this.closingNotified) {
      this.closingNotified = true;
      if (this.onClosingReached) {
        this.onClosingReached(lastPara);
      }
    }

    this.finishAll();
    return this.getState();
  }

  finishAll() {
    this.clearTimer();
    this.isTypingParagraph = false;
    this.isWaitingBetweenParagraphs = false;
    this.isAllCompleted = true;
    this.emitUpdate();

    if (this.onAllComplete) {
      this.onAllComplete(this.getState());
    }
  }

  emitUpdate() {
    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }
  }

  scheduleTimer(fn, delay) {
    const setTimer =
      typeof window !== 'undefined' && typeof window.setTimeout === 'function'
        ? window.setTimeout.bind(window)
        : setTimeout;
    this.timerId = setTimer(fn, delay);
  }

  clearTimer() {
    if (this.timerId) {
      const clear =
        typeof window !== 'undefined' && typeof window.clearTimeout === 'function'
          ? window.clearTimeout.bind(window)
          : clearTimeout;
      clear(this.timerId);
      this.timerId = null;
    }
  }

  destroy() {
    this.clearTimer();
  }
}

export default GuidingLetterTypewriter;

