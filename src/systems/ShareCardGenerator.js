import { GratitudeValidator } from './GratitudeValidator.js';

export class ShareCardGenerator {
  static CARD_WIDTH = 1200;
  static CARD_HEIGHT = 630;

  /**
   * Splits a text paragraph into wrapped lines that fit within `maxWidth`.
   */
  static wrapText(ctx, text = '', maxWidth = 920) {
    const cleanText = String(text ?? '').trim();
    if (!cleanText) return [''];

    const paragraphs = cleanText.split(/\r?\n/);
    const lines = [];

    paragraphs.forEach((para) => {
      const words = para.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push('');
        return;
      }

      let currentLine = words[0];
      for (let i = 1; i < words.length; i += 1) {
        const word = words[i];
        const testLine = `${currentLine} ${word}`;
        const measuredWidth =
          ctx && typeof ctx.measureText === 'function'
            ? ctx.measureText(testLine).width
            : testLine.length * 14;

        if (measuredWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
    });

    return lines.slice(0, 7);
  }

  /**
   * Renders the Gratitude Share Card onto the provided HTMLCanvasElement.
   * Required fields on the card:
   * - BUG OF GRATITUDE
   * - Recipient (Mentor Name)
   * - Gratitude Message
   * - Sender Name or Anonymous
   * - CodeGym 20/11/2026
   */
  static renderToCanvas(canvas, letter = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') {
      return null;
    }

    const width = ShareCardGenerator.CARD_WIDTH;
    const height = ShareCardGenerator.CARD_HEIGHT;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const mentorName = String(letter.mentorName || 'Thầy/Cô & Mentor').trim();
    const message = String(letter.message || '').trim();
    const senderDisplay =
      letter.publicSenderName ||
      GratitudeValidator.formatPublicSender({
        senderName: letter.senderName,
        isAnonymous: letter.isAnonymous,
      });

    // 1. Deep Cosmic Navy + Warm Nebula Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#070b16');
    bgGrad.addColorStop(0.5, '#111833');
    bgGrad.addColorStop(1, '#1d133b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Soft Warm & Cyan Glow Accents
    const topGlow = ctx.createRadialGradient(width * 0.82, height * 0.2, 10, width * 0.82, height * 0.2, 340);
    topGlow.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
    topGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);

    const bottomGlow = ctx.createRadialGradient(width * 0.18, height * 0.82, 10, width * 0.18, height * 0.82, 360);
    bottomGlow.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
    bottomGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Decorative Stars
    const starCoords = [
      [95, 88, 2.2], [210, 56, 1.5], [1080, 74, 2.5], [1120, 180, 1.6],
      [84, 520, 2.0], [1095, 535, 2.4], [610, 48, 1.8], [940, 565, 1.5],
    ];
    ctx.fillStyle = '#fde68a';
    starCoords.forEach(([sx, sy, sr]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Inner Card Frame
    const cardX = 64;
    const cardY = 52;
    const cardW = width - 128;
    const cardH = height - 104;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(cardX, cardY, cardW, cardH);
    ctx.fill();
    ctx.stroke();

    // Inner subtle cyan border
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(cardX + 10, cardY + 10, cardW - 20, cardH - 20);
    ctx.stroke();

    // 5. Header: BUG OF GRATITUDE + CodeGym 20/11/2026 Badge
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 22px "Press Start 2P", "JetBrains Mono", monospace';
    ctx.fillText('BUG OF GRATITUDE', cardX + 46, cardY + 64);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 16px "Be Vietnam Pro", sans-serif';
    ctx.fillText('"The biggest bug is forgetting to say THANK YOU."', cardX + 46, cardY + 96);

    // Event Stamp on Top Right
    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillText('CodeGym 20/11/2026', cardX + cardW - 46, cardY + 62);

    ctx.fillStyle = '#fde68a';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText('PATCH #005 // GRATITUDE SKY', cardX + cardW - 46, cardY + 90);

    // Divider line
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX + 46, cardY + 122);
    ctx.lineTo(cardX + cardW - 46, cardY + 122);
    ctx.stroke();

    // 6. Recipient (Mentor Name)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fef3c7';
    ctx.font = '700 30px "Be Vietnam Pro", sans-serif';
    ctx.fillText(`Kính gửi: ${mentorName}`, cardX + 46, cardY + 174);

    // 7. Gratitude Message Body (Wrapped)
    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 25px "Be Vietnam Pro", sans-serif';
    const wrappedLines = ShareCardGenerator.wrapText(
      ctx,
      `"${message}"`,
      cardW - 92
    );

    let lineY = cardY + 236;
    const lineHeight = 38;
    wrappedLines.forEach((line) => {
      ctx.fillText(line, cardX + 46, lineY);
      lineY += lineHeight;
    });

    // 8. Footer: Sender Name or Anonymous + CodeGym 20/11/2026
    const footerY = cardY + cardH - 48;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 46, footerY - 36);
    ctx.lineTo(cardX + cardW - 46, footerY - 36);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#67e8f9';
    ctx.font = '700 21px "Be Vietnam Pro", sans-serif';
    ctx.fillText(`Người gửi: ${senderDisplay}`, cardX + 46, footerY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 18px "Be Vietnam Pro", sans-serif';
    ctx.fillText('★ Bầu Trời Tri Ân — CodeGym 20/11/2026', cardX + cardW - 46, footerY);

    return {
      width,
      height,
      mentorName,
      senderDisplay,
      message,
      linesRendered: wrappedLines.length,
    };
  }

  static canvasToBlob(canvas) {
    return new Promise((resolve) => {
      if (!canvas) {
        resolve(null);
        return;
      }
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
        return;
      }
      resolve(null);
    });
  }

  static buildFileName(mentorName = 'mentor') {
    const slug = String(mentorName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
    return `bug-of-gratitude-${slug || '20-11'}.png`;
  }

  /**
   * Downloads the rendered Share Card as a PNG image.
   */
  static async downloadCard(canvas, letter = {}) {
    if (!canvas) {
      return { success: false, method: 'none', error: 'Canvas không khả dụng.' };
    }

    ShareCardGenerator.renderToCanvas(canvas, letter);
    const fileName = ShareCardGenerator.buildFileName(letter.mentorName);

    try {
      const dataUrl =
        typeof canvas.toDataURL === 'function' ? canvas.toDataURL('image/png') : '';
      if (!dataUrl) {
        return { success: false, method: 'none', error: 'Không thể xuất dữ liệu ảnh.' };
      }

      if (typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      return {
        success: true,
        method: 'download',
        fileName,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        method: 'download',
        error: err?.message || 'Không thể tải ảnh về máy.',
      };
    }
  }

  /**
   * Shares the Gratitude Card via Web Share API if supported by the browser.
   * Falls back automatically to downloading the PNG if Web Share API is unavailable.
   */
  static async shareCard(canvas, letter = {}, navigatorObj = typeof navigator !== 'undefined' ? navigator : null) {
    if (!canvas) {
      return { success: false, method: 'none', error: 'Canvas không khả dụng.' };
    }

    ShareCardGenerator.renderToCanvas(canvas, letter);
    const fileName = ShareCardGenerator.buildFileName(letter.mentorName);
    const shareTitle = 'BUG OF GRATITUDE — CodeGym 20/11/2026';
    const shareText = `Lời tri ân gửi tới ${letter.mentorName || 'Thầy/Cô'}: "${letter.message || ''}" — #BugOfGratitude #CodeGym2011`;

    // Check Web Share API support
    if (navigatorObj && typeof navigatorObj.share === 'function') {
      try {
        const blob = await ShareCardGenerator.canvasToBlob(canvas);
        if (blob && typeof File === 'function') {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (
            typeof navigatorObj.canShare === 'function' &&
            navigatorObj.canShare({ files: [file] })
          ) {
            await navigatorObj.share({
              title: shareTitle,
              text: shareText,
              files: [file],
            });
            return {
              success: true,
              method: 'web_share_file',
              fileName,
              error: null,
            };
          }
        }

        // Share text/title if file sharing is not supported by this browser's Web Share implementation
        await navigatorObj.share({
          title: shareTitle,
          text: shareText,
        });
        return {
          success: true,
          method: 'web_share_text',
          fileName,
          error: null,
        };
      } catch (err) {
        // If user explicitly aborted the share sheet, do not force download
        if (err?.name === 'AbortError') {
          return {
            success: false,
            method: 'aborted',
            error: 'Đã hủy chia sẻ.',
          };
        }
        // Otherwise fall back to downloading the image
      }
    }

    // Fallback when Web Share API is unavailable
    const downloadResult = await ShareCardGenerator.downloadCard(canvas, letter);
    return {
      ...downloadResult,
      method: downloadResult.success ? 'download_fallback' : 'none',
    };
  }
}

export default ShareCardGenerator;
