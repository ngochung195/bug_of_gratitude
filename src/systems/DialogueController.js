import { SPEAKER_PROFILES, SPEAKER_TYPES } from '../data/introStoryData.js';

export class DialogueController {
  constructor({
    nodes = [],
    typeSpeedMs = 24,
    onUpdate,
    onNodeChange,
    onComplete,
    onTypeChar,
  } = {}) {
    this.nodes = Array.isArray(nodes) ? nodes : [];
    this.typeSpeedMs = Math.max(5, Number(typeSpeedMs) || 24);
    this.onUpdate = typeof onUpdate === 'function' ? onUpdate : null;
    this.onNodeChange = typeof onNodeChange === 'function' ? onNodeChange : null;
    this.onComplete = typeof onComplete === 'function' ? onComplete : null;
    this.onTypeChar = typeof onTypeChar === 'function' ? onTypeChar : null;

    this.currentIndex = 0;
    this.charIndex = 0;
    this.isTyping = false;
    this.isCompleted = false;
    this.timerId = null;
  }

  setNodes(nodes = []) {
    this.stopTimer();
    this.nodes = Array.isArray(nodes) ? nodes : [];
    this.currentIndex = 0;
    this.charIndex = 0;
    this.isTyping = false;
    this.isCompleted = false;
  }

  getCurrentNode() {
    if (this.currentIndex < 0 || this.currentIndex >= this.nodes.length) {
      return null;
    }
    return this.nodes[this.currentIndex];
  }

  getSpeakerProfile(node = this.getCurrentNode()) {
    const key = node?.speaker || SPEAKER_TYPES.SYSTEM;
    return SPEAKER_PROFILES[key] || SPEAKER_PROFILES[SPEAKER_TYPES.SYSTEM];
  }

  getDisplayedText() {
    const node = this.getCurrentNode();
    if (!node) return '';
    const full = String(node.text || '');
    return full.slice(0, this.charIndex);
  }

  getState() {
    const node = this.getCurrentNode();
    const fullText = String(node?.text || '');
    return {
      node,
      currentIndex: this.currentIndex,
      totalNodes: this.nodes.length,
      speakerProfile: this.getSpeakerProfile(node),
      displayedText: fullText.slice(0, this.charIndex),
      fullText,
      isTyping: this.isTyping,
      isLastNode: this.currentIndex >= this.nodes.length - 1,
      isCompleted: this.isCompleted,
    };
  }

  start(startIndex = 0) {
    this.stopTimer();
    if (this.nodes.length === 0) {
      this.isCompleted = true;
      if (this.onComplete) this.onComplete();
      return;
    }

    this.currentIndex = Math.max(0, Math.min(this.nodes.length - 1, startIndex));
    this.isCompleted = false;
    this.beginTypingCurrentNode();
  }

  beginTypingCurrentNode() {
    this.stopTimer();
    const node = this.getCurrentNode();
    if (!node) return;

    this.charIndex = 0;
    const fullText = String(node.text || '');
    this.isTyping = fullText.length > 0;

    if (this.onNodeChange) {
      this.onNodeChange(this.getState());
    }
    this.emitUpdate();

    if (!this.isTyping) {
      return;
    }

    this.scheduleNextChar();
  }

  scheduleNextChar() {
    this.stopTimer();
    const setTimer =
      typeof window !== 'undefined' && typeof window.setTimeout === 'function'
        ? window.setTimeout.bind(window)
        : setTimeout;

    this.timerId = setTimer(() => {
      this.stepChar();
    }, this.typeSpeedMs);
  }

  stepChar() {
    const node = this.getCurrentNode();
    if (!node) {
      this.isTyping = false;
      this.stopTimer();
      return;
    }

    const fullText = String(node.text || '');
    if (this.charIndex < fullText.length) {
      this.charIndex += 1;
      const currentChar = fullText[this.charIndex - 1];

      if (this.onTypeChar && currentChar && currentChar.trim() && this.charIndex % 3 === 1) {
        this.onTypeChar(node.speaker || SPEAKER_TYPES.SYSTEM, currentChar);
      }

      if (this.charIndex >= fullText.length) {
        this.isTyping = false;
        this.stopTimer();
        this.emitUpdate();
      } else {
        this.emitUpdate();
        this.scheduleNextChar();
      }
    } else {
      this.isTyping = false;
      this.stopTimer();
      this.emitUpdate();
    }
  }

  completeTyping() {
    const node = this.getCurrentNode();
    if (!node) return this.getState();

    this.stopTimer();
    this.charIndex = String(node.text || '').length;
    this.isTyping = false;
    this.emitUpdate();
    return this.getState();
  }

  /**
   * Called when user presses Space, Enter, or clicks Continue:
   * - If currently typing, reveals full text of the current line immediately.
   * - If line is already fully revealed, advances to the next line or completes.
   */
  advance() {
    if (this.isCompleted) return this.getState();

    if (this.isTyping) {
      return this.completeTyping();
    }

    if (this.currentIndex < this.nodes.length - 1) {
      this.currentIndex += 1;
      this.beginTypingCurrentNode();
      return this.getState();
    }

    this.isCompleted = true;
    this.stopTimer();
    this.emitUpdate();
    if (this.onComplete) {
      this.onComplete(this.getState());
    }
    return this.getState();
  }

  /**
   * Skips directly to the final node (fully revealed) or triggers completion.
   */
  skipToFinalNode() {
    this.stopTimer();
    if (this.nodes.length === 0) {
      this.isCompleted = true;
      if (this.onComplete) this.onComplete(this.getState());
      return this.getState();
    }

    this.currentIndex = this.nodes.length - 1;
    const finalNode = this.getCurrentNode();
    this.charIndex = String(finalNode?.text || '').length;
    this.isTyping = false;

    if (this.onNodeChange) {
      this.onNodeChange(this.getState());
    }
    this.emitUpdate();
    return this.getState();
  }

  emitUpdate() {
    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }
  }

  stopTimer() {
    if (this.timerId) {
      const clearTimer =
        typeof window !== 'undefined' && typeof window.clearTimeout === 'function'
          ? window.clearTimeout.bind(window)
          : clearTimeout;
      clearTimer(this.timerId);
      this.timerId = null;
    }
  }

  destroy() {
    this.stopTimer();
  }
}

export default DialogueController;
