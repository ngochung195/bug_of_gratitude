import { APP_CONFIG, EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { SEED_GRATITUDE_MESSAGES } from '../data/SeedGratitudeData.js';
import { getSupabaseStatus, supabase as defaultSupabaseClient } from './supabaseClient.js';

function getLocalStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export class ReactionService {
  constructor({
    client = defaultSupabaseClient,
    bus = eventBus,
    storageKey = APP_CONFIG.REACTION_STORAGE_KEY || 'bog_reacted_messages_v1',
    cooldownMs = APP_CONFIG.REACTION_COOLDOWN_MS || 1200,
  } = {}) {
    this.client = client;
    this.eventBus = bus;
    this.storageKey = storageKey;
    this.cooldownMs = cooldownMs;
    this.lastReactionTimestamp = 0;
    this.pendingReactions = new Set();
    this.localCountFallback = new Map();

    SEED_GRATITUDE_MESSAGES.forEach((seed) => {
      if (seed && seed.id && typeof seed.reactionCount === 'number') {
        this.localCountFallback.set(seed.id, seed.reactionCount);
      }
    });
  }

  setClient(client) {
    this.client = client;
  }

  getReactedMessageIds() {
    try {
      const storage = getLocalStorage();
      if (!storage) return [];
      const raw = storage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  hasUserReacted(messageId) {
    if (!messageId) return false;
    return this.getReactedMessageIds().includes(String(messageId));
  }

  markMessageReacted(messageId) {
    if (!messageId) return;
    const idStr = String(messageId);
    const existing = this.getReactedMessageIds();
    if (existing.includes(idStr)) return;

    const updated = [idStr, ...existing].slice(0, 500);
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(this.storageKey, JSON.stringify(updated));
      }
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Add a heart reaction to an approved gratitude message.
   * Includes anti-spam protection:
   * - Rejects duplicate heart reactions on the same message from the same browser.
   * - Enforces a cooldown timer between reaction actions.
   * - Blocks concurrent in-flight requests for the same messageId.
   */
  async addHeartReaction(messageId, reactionType = 'heart') {
    const cleanId = String(messageId ?? '').trim();
    if (!cleanId) {
      return {
        success: false,
        syncedToCloud: false,
        reason: 'INVALID_MESSAGE_ID',
        error: 'ID lời cảm ơn không hợp lệ.',
      };
    }

    if (this.hasUserReacted(cleanId)) {
      return {
        success: false,
        syncedToCloud: false,
        reason: 'ALREADY_REACTED',
        error: 'Bạn đã thả tim cho lá thư tri ân này rồi.',
      };
    }

    if (this.pendingReactions.has(cleanId)) {
      return {
        success: false,
        syncedToCloud: false,
        reason: 'IN_PROGRESS',
        error: 'Đang xử lý lượt thả tim...',
      };
    }

    const now = Date.now();
    if (now - this.lastReactionTimestamp < this.cooldownMs) {
      return {
        success: false,
        syncedToCloud: false,
        reason: 'RATE_LIMITED',
        error: 'Bạn thao tác quá nhanh. Vui lòng đợi giây lát trước khi thả tim tiếp.',
      };
    }

    this.lastReactionTimestamp = now;
    this.pendingReactions.add(cleanId);

    try {
      const safeType = reactionType === 'heart' ? 'heart' : 'heart';

      if (!this.client) {
        this.markMessageReacted(cleanId);
        const nextLocalCount = (this.localCountFallback.get(cleanId) || 0) + 1;
        this.localCountFallback.set(cleanId, nextLocalCount);

        this.eventBus.emit(EVENTS.GRATITUDE_REACTION_ADDED, {
          messageId: cleanId,
          reactionType: safeType,
          syncedToCloud: false,
        });

        return {
          success: true,
          syncedToCloud: false,
          reason: 'LOCAL_ONLY',
          error: getSupabaseStatus().message,
        };
      }

      const { error } = await this.client.from('gratitude_reactions').insert([
        {
          message_id: cleanId,
          reaction_type: safeType,
        },
      ]);

      if (error) {
        return {
          success: false,
          syncedToCloud: false,
          reason: 'DATABASE_ERROR',
          error: error.message || 'Không thể lưu lượt thả tim lên Supabase.',
        };
      }

      this.markMessageReacted(cleanId);
      this.eventBus.emit(EVENTS.GRATITUDE_REACTION_ADDED, {
        messageId: cleanId,
        reactionType: safeType,
        syncedToCloud: true,
      });

      return {
        success: true,
        syncedToCloud: true,
        reason: 'OK',
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        syncedToCloud: false,
        reason: 'NETWORK_ERROR',
        error: err?.message || 'Lỗi kết nối mạng khi thả tim.',
      };
    } finally {
      this.pendingReactions.delete(cleanId);
    }
  }

  /**
   * Get total number of heart reactions across all approved messages in the database.
   * Always returns real database count (never fake data).
   */
  async getTotalReactionsCount(reactionType = 'heart') {
    if (!this.client) {
      let localTotal = 0;
      this.localCountFallback.forEach((val) => {
        localTotal += Number(val) || 0;
      });
      return {
        count: localTotal,
        fromCloud: false,
        error: getSupabaseStatus().message,
      };
    }

    try {
      const { count, error } = await this.client
        .from('gratitude_reactions')
        .select('id', { count: 'exact', head: true })
        .eq('reaction_type', reactionType);

      if (error) {
        return {
          count: 0,
          fromCloud: false,
          error: error.message || 'Không thể tải tổng số lượt thả tim.',
        };
      }

      return {
        count: typeof count === 'number' ? count : 0,
        fromCloud: true,
        error: null,
      };
    } catch (err) {
      return {
        count: 0,
        fromCloud: false,
        error: err?.message || 'Lỗi kết nối mạng khi tải tổng số lượt thả tim.',
      };
    }
  }

  /**
   * Get total heart reaction count for a single gratitude message.
   */
  async getReactionCount(messageId, reactionType = 'heart') {
    const cleanId = String(messageId ?? '').trim();
    if (!cleanId) {
      return {
        count: 0,
        fromCloud: false,
        error: 'ID lời cảm ơn không hợp lệ.',
      };
    }

    if (!this.client) {
      return {
        count: this.localCountFallback.get(cleanId) || (this.hasUserReacted(cleanId) ? 1 : 0),
        fromCloud: false,
        error: getSupabaseStatus().message,
      };
    }

    try {
      const { count, error } = await this.client
        .from('gratitude_reactions')
        .select('id', { count: 'exact', head: true })
        .eq('message_id', cleanId)
        .eq('reaction_type', reactionType);

      if (error) {
        return {
          count: this.localCountFallback.get(cleanId) || 0,
          fromCloud: false,
          error: error.message || 'Không thể tải số lượt thả tim.',
        };
      }

      return {
        count: typeof count === 'number' ? count : 0,
        fromCloud: true,
        error: null,
      };
    } catch (err) {
      return {
        count: this.localCountFallback.get(cleanId) || 0,
        fromCloud: false,
        error: err?.message || 'Lỗi kết nối mạng khi tải số lượt thả tim.',
      };
    }
  }

  /**
   * Batch-fetch heart reaction counts for multiple message IDs.
   */
  async getReactionCountsForMessages(messageIds = []) {
    const cleanIds = Array.from(
      new Set(
        (Array.isArray(messageIds) ? messageIds : [])
          .map((id) => String(id ?? '').trim())
          .filter(Boolean)
      )
    );

    const countsMap = {};
    cleanIds.forEach((id) => {
      countsMap[id] = 0;
    });

    if (cleanIds.length === 0) {
      return {
        counts: countsMap,
        fromCloud: Boolean(this.client),
        error: null,
      };
    }

    if (!this.client) {
      cleanIds.forEach((id) => {
        countsMap[id] =
          this.localCountFallback.get(id) || (this.hasUserReacted(id) ? 1 : 0);
      });
      return {
        counts: countsMap,
        fromCloud: false,
        error: getSupabaseStatus().message,
      };
    }

    try {
      const { data, error } = await this.client
        .from('gratitude_reactions')
        .select('message_id')
        .in('message_id', cleanIds)
        .eq('reaction_type', 'heart');

      if (error) {
        return {
          counts: countsMap,
          fromCloud: false,
          error: error.message || 'Không thể tải danh sách lượt thả tim.',
        };
      }

      if (Array.isArray(data)) {
        data.forEach((row) => {
          const id = row?.message_id;
          if (id && Object.prototype.hasOwnProperty.call(countsMap, id)) {
            countsMap[id] += 1;
          }
        });
      }

      return {
        counts: countsMap,
        fromCloud: true,
        error: null,
      };
    } catch (err) {
      return {
        counts: countsMap,
        fromCloud: false,
        error: err?.message || 'Lỗi kết nối mạng khi tải danh sách lượt thả tim.',
      };
    }
  }
}

export const reactionService = new ReactionService();
export default ReactionService;

