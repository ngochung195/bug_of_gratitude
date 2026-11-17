import { APP_CONFIG, EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { SEED_GRATITUDE_MESSAGES } from '../data/SeedGratitudeData.js';
import { GratitudeValidator } from '../systems/GratitudeValidator.js';
import { gratitudeStorage } from './GratitudeStorage.js';
import { getSupabaseStatus, supabase as defaultSupabaseClient } from './supabaseClient.js';

export function normalizeGratitudeRow(row) {
  if (!row || typeof row !== 'object') return null;

  const isAnonymous = Boolean(row.is_anonymous ?? row.isAnonymous);
  const rawSender = String(row.sender_name ?? row.senderName ?? '').trim();
  const mentorName = String(row.mentor_name ?? row.mentorName ?? '').trim();
  const message = String(row.message ?? '').trim();

  return {
    id: row.id,
    mentorName,
    senderName: isAnonymous ? 'Anonymous' : rawSender || 'Anonymous',
    publicSenderName: GratitudeValidator.formatPublicSender({
      senderName: rawSender,
      isAnonymous,
    }),
    message,
    isAnonymous,
    isApproved:
      row.is_approved !== undefined
        ? Boolean(row.is_approved)
        : row.isApproved !== undefined
          ? Boolean(row.isApproved)
          : true,
    reactionCount: Number(row.reactionCount ?? 0),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export class GratitudeService {
  constructor({
    client = defaultSupabaseClient,
    storage = gratitudeStorage,
    bus = eventBus,
    includeSeedData = true,
  } = {}) {
    this.client = client;
    this.storage = storage;
    this.eventBus = bus;
    this.includeSeedData = includeSeedData;
    this.activeChannel = null;
    this.channelCallbacks = new Set();
    this.hadConnectionDrop = false;
    this.isSyncing = false;
  }

  setClient(client) {
    this.client = client;
  }

  isCloudAvailable() {
    return Boolean(this.client);
  }

  /**
   * Returns merged local + 10 initial seeded wishes (deduplicated by id, sorted newest first).
   */
  getLocalAndSeededMessages() {
    const map = new Map();

    if (this.includeSeedData) {
      SEED_GRATITUDE_MESSAGES.forEach((seed) => {
        const norm = normalizeGratitudeRow(seed);
        if (norm && norm.isApproved) {
          map.set(norm.id, norm);
        }
      });
    }

    const stored = this.storage ? this.storage.getAllLetters() : [];
    stored.forEach((item) => {
      const norm = normalizeGratitudeRow({ ...item, isApproved: true });
      if (norm && norm.mentorName && norm.message) {
        map.set(norm.id, norm);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Submit a new gratitude letter directly to the shared sky (is_approved = true immediately).
   */
  async submitGratitude(rawInput = {}) {
    const creation = GratitudeValidator.createLetterObject(rawInput);

    if (!creation.isValid) {
      return {
        success: false,
        syncedToCloud: false,
        pendingModeration: false,
        letter: null,
        errors: creation.errors,
        error: creation.firstErrorMessage,
      };
    }

    const localLetter = this.storage.saveLetter({
      ...creation.letter,
      isApproved: true,
      isSynced: false,
    });

    if (!this.client) {
      const status = getSupabaseStatus();
      return {
        success: true,
        syncedToCloud: false,
        pendingModeration: false,
        letter: localLetter,
        error: status.message,
      };
    }

    const dbPayload = {
      id: localLetter.id,
      mentor_name: localLetter.mentorName.slice(0, 100),
      sender_name: localLetter.isAnonymous
        ? null
        : (localLetter.senderName || 'Anonymous').slice(0, 100),
      message: localLetter.message.slice(0, 300),
      is_anonymous: Boolean(localLetter.isAnonymous),
      is_approved: true,
      created_at: localLetter.createdAt,
    };

    try {
      const { error } = await this.client.from('gratitude_messages').insert([dbPayload]);

      if (error) {
        return {
          success: true,
          syncedToCloud: false,
          pendingModeration: false,
          letter: localLetter,
          error: error.message || 'Không thể đồng bộ lên Supabase, đã hiển thị trên bầu trời máy bạn.',
        };
      }

      this.storage.markLetterSynced(localLetter.id);
      const syncedLetter = {
        ...localLetter,
        isApproved: true,
        isSynced: true,
        syncedAt: new Date().toISOString(),
      };

      return {
        success: true,
        syncedToCloud: true,
        pendingModeration: false,
        letter: syncedLetter,
        error: null,
      };
    } catch (err) {
      return {
        success: true,
        syncedToCloud: false,
        pendingModeration: false,
        letter: localLetter,
        error: err?.message || 'Lỗi kết nối mạng khi gửi lên Supabase. Đã hiển thị trên bầu trời.',
      };
    }
  }

  /**
   * Syncs any unsynced LocalStorage letters to Supabase once with is_approved = true.
   */
  async syncUnsyncedLocalLetters() {
    if (!this.client || this.isSyncing) {
      return {
        syncedCount: 0,
        failedCount: 0,
        skipped: true,
      };
    }

    const unsynced = this.storage.getUnsyncedLetters();
    if (unsynced.length === 0) {
      return {
        syncedCount: 0,
        failedCount: 0,
        skipped: false,
      };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let failedCount = 0;

    try {
      for (const letter of unsynced) {
        const mentorName = String(letter.mentorName || '').trim();
        const message = String(letter.message || '').trim();

        if (!mentorName || !message || message.length > 300) {
          failedCount += 1;
          continue;
        }

        const dbPayload = {
          id: letter.id,
          mentor_name: mentorName.slice(0, 100),
          sender_name: letter.isAnonymous
            ? null
            : String(letter.senderName || 'Anonymous')
                .trim()
                .slice(0, 100),
          message: message.slice(0, 300),
          is_anonymous: Boolean(letter.isAnonymous),
          is_approved: true,
          created_at: letter.createdAt || new Date().toISOString(),
        };

        try {
          const { error } = await this.client.from('gratitude_messages').insert([dbPayload]);

          if (!error || error.code === '23505') {
            this.storage.markLetterSynced(letter.id);
            syncedCount += 1;
          } else {
            failedCount += 1;
          }
        } catch {
          failedCount += 1;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return {
      syncedCount,
      failedCount,
      skipped: false,
    };
  }

  /**
   * Fetch shared sky gratitude messages with optional mentor search and pagination.
   */
  async getApprovedMessages({
    page = 1,
    pageSize = APP_CONFIG.DEFAULT_PAGE_SIZE || 12,
    mentorQuery = '',
  } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 12));
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    const trimmedQuery = String(mentorQuery ?? '').trim().toLowerCase();

    const applyLocalFallback = (errorMsg = null) => {
      let allItems = this.getLocalAndSeededMessages();
      if (trimmedQuery.length > 0) {
        allItems = allItems.filter((item) =>
          item.mentorName.toLowerCase().includes(trimmedQuery)
        );
      }
      const totalCount = allItems.length;
      const totalPages = totalCount > 0 ? Math.ceil(totalCount / safePageSize) : 0;
      const pagedItems = allItems.slice(from, to + 1);

      return {
        items: pagedItems,
        page: safePage,
        pageSize: safePageSize,
        totalCount,
        totalPages,
        hasMore: safePage < totalPages,
        fromCloud: false,
        error: errorMsg,
      };
    };

    if (!this.client) {
      return applyLocalFallback(null);
    }

    try {
      let query = this.client
        .from('gratitude_messages')
        .select(
          'id, mentor_name, sender_name, message, is_anonymous, is_approved, created_at',
          { count: 'exact' }
        )
        .eq('is_approved', true);

      if (trimmedQuery.length > 0) {
        query = query.ilike('mentor_name', `%${trimmedQuery}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return applyLocalFallback(error.message);
      }

      const cloudItems = Array.isArray(data)
        ? data
            .filter((row) => row && row.is_approved === true)
            .map((row) => normalizeGratitudeRow(row))
            .filter(Boolean)
        : [];

      if (cloudItems.length === 0 && safePage === 1 && this.includeSeedData) {
        return applyLocalFallback(null);
      }

      const totalCount = typeof count === 'number' ? count : cloudItems.length;
      const totalPages = totalCount > 0 ? Math.ceil(totalCount / safePageSize) : 0;

      return {
        items: cloudItems,
        page: safePage,
        pageSize: safePageSize,
        totalCount,
        totalPages,
        hasMore: safePage < totalPages,
        fromCloud: true,
        error: null,
      };
    } catch (err) {
      return applyLocalFallback(err?.message || null);
    }
  }

  /**
   * Search messages by Mentor Name.
   */
  async searchByMentorName(mentorName = '', { page = 1, pageSize = 12 } = {}) {
    return this.getApprovedMessages({
      page,
      pageSize,
      mentorQuery: mentorName,
    });
  }

  /**
   * Get total number of shared gratitude messages.
   */
  async getApprovedCount({ mentorQuery = '' } = {}) {
    const trimmedQuery = String(mentorQuery ?? '').trim();

    if (!this.client) {
      let list = this.getLocalAndSeededMessages();
      if (trimmedQuery) {
        list = list.filter((m) =>
          m.mentorName.toLowerCase().includes(trimmedQuery.toLowerCase())
        );
      }
      return {
        count: list.length,
        fromCloud: false,
        error: null,
      };
    }

    try {
      let query = this.client
        .from('gratitude_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_approved', true);

      if (trimmedQuery.length > 0) {
        query = query.ilike('mentor_name', `%${trimmedQuery}%`);
      }

      const { count, error } = await query;

      if (error) {
        const fallbackCount = this.getLocalAndSeededMessages().length;
        return {
          count: fallbackCount,
          fromCloud: false,
          error: error.message,
        };
      }

      const finalCount =
        typeof count === 'number' && count > 0
          ? count
          : this.includeSeedData
            ? this.getLocalAndSeededMessages().length
            : 0;

      return {
        count: finalCount,
        fromCloud: true,
        error: null,
      };
    } catch (err) {
      return {
        count: this.getLocalAndSeededMessages().length,
        fromCloud: false,
        error: err?.message || null,
      };
    }
  }

  /**
   * Get community statistics for GRATITUDE SKY.
   */
  async getCommunityStatistics() {
    const computeLocalStats = () => {
      const all = this.getLocalAndSeededMessages();
      const mentorSet = new Set();
      let totalReactions = 0;

      all.forEach((m) => {
        const normMentor = String(m.mentorName || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();
        if (normMentor) mentorSet.add(normMentor);
        totalReactions += Number(m.reactionCount || 0);
      });

      return {
        totalApprovedMessages: all.length,
        totalHeartReactions: totalReactions,
        uniqueMentorsCount: mentorSet.size,
        fromCloud: false,
        error: null,
      };
    };

    if (!this.client) {
      return computeLocalStats();
    }

    try {
      const [messagesRes, reactionsRes] = await Promise.all([
        this.client
          .from('gratitude_messages')
          .select('id, mentor_name, is_approved', { count: 'exact' })
          .eq('is_approved', true),
        this.client
          .from('gratitude_reactions')
          .select('id', { count: 'exact', head: true })
          .eq('reaction_type', 'heart'),
      ]);

      if (messagesRes.error) {
        return computeLocalStats();
      }

      const approvedRows = Array.isArray(messagesRes.data)
        ? messagesRes.data.filter((row) => row && row.is_approved === true)
        : [];

      if (approvedRows.length === 0 && this.includeSeedData) {
        return computeLocalStats();
      }

      const totalApprovedMessages =
        typeof messagesRes.count === 'number' ? messagesRes.count : approvedRows.length;

      const mentorSet = new Set();
      approvedRows.forEach((row) => {
        const normalizedMentor = String(row.mentor_name || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();
        if (normalizedMentor) {
          mentorSet.add(normalizedMentor);
        }
      });

      const totalHeartReactions =
        !reactionsRes.error && typeof reactionsRes.count === 'number'
          ? reactionsRes.count
          : 0;

      return {
        totalApprovedMessages,
        totalHeartReactions,
        uniqueMentorsCount: mentorSet.size,
        fromCloud: true,
        error: null,
      };
    } catch {
      return computeLocalStats();
    }
  }

  /**
   * Subscribe to Realtime updates for newly submitted messages on the shared sky.
   */
  subscribeToApprovedMessages({
    onApprovedMessage,
    onStatusChange,
    onReconnectFallback,
  } = {}) {
    const subscriberEntry = {
      onApprovedMessage: typeof onApprovedMessage === 'function' ? onApprovedMessage : null,
      onStatusChange: typeof onStatusChange === 'function' ? onStatusChange : null,
      onReconnectFallback:
        typeof onReconnectFallback === 'function' ? onReconnectFallback : null,
    };

    this.channelCallbacks.add(subscriberEntry);

    if (!this.client) {
      if (subscriberEntry.onStatusChange) {
        subscriberEntry.onStatusChange('LOCAL_SKY_READY');
      }
      return () => {
        this.channelCallbacks.delete(subscriberEntry);
      };
    }

    if (this.activeChannel) {
      return () => {
        this.channelCallbacks.delete(subscriberEntry);
        if (this.channelCallbacks.size === 0) {
          this.unsubscribeFromApprovedMessages();
        }
      };
    }

    this.hadConnectionDrop = false;

    const handleRealtimePayload = (payload) => {
      const nextRow = payload?.new;
      if (!nextRow || nextRow.is_approved !== true) {
        return;
      }

      if (
        payload.eventType === 'UPDATE' &&
        payload.old &&
        payload.old.is_approved === true
      ) {
        return;
      }

      const normalized = normalizeGratitudeRow(nextRow);
      if (!normalized) return;

      this.eventBus.emit(EVENTS.GRATITUDE_APPROVED_RECEIVED, {
        message: normalized,
        eventType: payload.eventType,
      });

      this.channelCallbacks.forEach((cb) => {
        if (cb.onApprovedMessage) {
          cb.onApprovedMessage(normalized, payload);
        }
      });
    };

    try {
      this.activeChannel = this.client
        .channel('public:gratitude_messages:approved')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gratitude_messages',
            filter: 'is_approved=eq.true',
          },
          handleRealtimePayload
        )
        .subscribe((status) => {
          this.channelCallbacks.forEach((cb) => {
            if (cb.onStatusChange) {
              cb.onStatusChange(status);
            }
          });

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.hadConnectionDrop = true;
          } else if (status === 'SUBSCRIBED' && this.hadConnectionDrop) {
            this.hadConnectionDrop = false;
            this.channelCallbacks.forEach((cb) => {
              if (cb.onReconnectFallback) {
                cb.onReconnectFallback();
              }
            });
          }
        });
    } catch {
      this.activeChannel = null;
    }

    return () => {
      this.channelCallbacks.delete(subscriberEntry);
      if (this.channelCallbacks.size === 0) {
        this.unsubscribeFromApprovedMessages();
      }
    };
  }

  /**
   * Unsubscribe and clean up the active Realtime channel.
   */
  async unsubscribeFromApprovedMessages() {
    this.channelCallbacks.clear();
    if (!this.activeChannel) {
      return false;
    }

    const channelToRemove = this.activeChannel;
    this.activeChannel = null;

    try {
      if (this.client && typeof this.client.removeChannel === 'function') {
        await this.client.removeChannel(channelToRemove);
      } else if (typeof channelToRemove.unsubscribe === 'function') {
        await channelToRemove.unsubscribe();
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const gratitudeService = new GratitudeService();
export default GratitudeService;
