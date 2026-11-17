import { APP_CONFIG, EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
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
    isApproved: Boolean(row.is_approved ?? row.isApproved),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export class GratitudeService {
  constructor({
    client = defaultSupabaseClient,
    storage = gratitudeStorage,
    bus = eventBus,
  } = {}) {
    this.client = client;
    this.storage = storage;
    this.eventBus = bus;
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
   * Submit a new gratitude letter:
   * 1. Validates fields (Mentor Name required, Message <= 300 chars).
   * 2. Saves a local copy in LocalStorage with isSynced = false.
   * 3. Inserts into Supabase with is_approved = false (pending moderation).
   * 4. Marks local copy as isSynced = true when Supabase insert succeeds.
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
      isSynced: false,
    });

    if (!this.client) {
      const status = getSupabaseStatus();
      return {
        success: true,
        syncedToCloud: false,
        pendingModeration: true,
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
      is_approved: false,
      created_at: localLetter.createdAt,
    };

    try {
      // Do NOT chain .select() after .insert() because RLS only allows SELECT where is_approved = true
      const { error } = await this.client.from('gratitude_messages').insert([dbPayload]);

      if (error) {
        return {
          success: true,
          syncedToCloud: false,
          pendingModeration: true,
          letter: localLetter,
          error: error.message || 'Không thể đồng bộ lên Supabase, đã lưu bản sao tại máy.',
        };
      }

      this.storage.markLetterSynced(localLetter.id);
      const syncedLetter = {
        ...localLetter,
        isSynced: true,
        syncedAt: new Date().toISOString(),
      };

      return {
        success: true,
        syncedToCloud: true,
        pendingModeration: true,
        letter: syncedLetter,
        error: null,
      };
    } catch (err) {
      return {
        success: true,
        syncedToCloud: false,
        pendingModeration: true,
        letter: localLetter,
        error: err?.message || 'Lỗi kết nối mạng khi gửi lên Supabase. Đã lưu tạm vào máy.',
      };
    }
  }

  /**
   * Syncs any unsynced LocalStorage letters to Supabase once.
   * Marks each synced letter with `isSynced: true` so reloading the page does not resend.
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
          is_approved: false,
          created_at: letter.createdAt || new Date().toISOString(),
        };

        try {
          const { error } = await this.client.from('gratitude_messages').insert([dbPayload]);

          // 23505 is PostgreSQL unique_violation (already inserted previously)
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
   * Fetch approved gratitude messages with optional mentor search and pagination.
   * Strictly fetches `is_approved = true` ordered by `created_at` descending.
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
    const trimmedQuery = String(mentorQuery ?? '').trim();

    if (!this.client) {
      return {
        items: [],
        page: safePage,
        pageSize: safePageSize,
        totalCount: 0,
        totalPages: 0,
        hasMore: false,
        fromCloud: false,
        error: getSupabaseStatus().message,
      };
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
        return {
          items: [],
          page: safePage,
          pageSize: safePageSize,
          totalCount: 0,
          totalPages: 0,
          hasMore: false,
          fromCloud: false,
          error: error.message || 'Không thể tải danh sách lời cảm ơn từ Supabase.',
        };
      }

      const items = Array.isArray(data)
        ? data
            .filter((row) => row && row.is_approved === true)
            .map((row) => normalizeGratitudeRow(row))
            .filter(Boolean)
        : [];

      const totalCount = typeof count === 'number' ? count : items.length;
      const totalPages = totalCount > 0 ? Math.ceil(totalCount / safePageSize) : 0;

      return {
        items,
        page: safePage,
        pageSize: safePageSize,
        totalCount,
        totalPages,
        hasMore: safePage < totalPages,
        fromCloud: true,
        error: null,
      };
    } catch (err) {
      return {
        items: [],
        page: safePage,
        pageSize: safePageSize,
        totalCount: 0,
        totalPages: 0,
        hasMore: false,
        fromCloud: false,
        error: err?.message || 'Lỗi kết nối mạng khi tải danh sách lời cảm ơn.',
      };
    }
  }

  /**
   * Search approved messages by Mentor Name.
   */
  async searchByMentorName(mentorName = '', { page = 1, pageSize = 12 } = {}) {
    return this.getApprovedMessages({
      page,
      pageSize,
      mentorQuery: mentorName,
    });
  }

  /**
   * Get total number of approved gratitude messages.
   */
  async getApprovedCount({ mentorQuery = '' } = {}) {
    const trimmedQuery = String(mentorQuery ?? '').trim();

    if (!this.client) {
      return {
        count: 0,
        fromCloud: false,
        error: getSupabaseStatus().message,
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
        return {
          count: 0,
          fromCloud: false,
          error: error.message || 'Không thể đếm tổng số lời cảm ơn.',
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
        error: err?.message || 'Lỗi kết nối mạng khi lấy tổng số lời cảm ơn.',
      };
    }
  }

  /**
   * Get real community statistics from Supabase:
   * - totalApprovedMessages (is_approved = true)
   * - totalHeartReactions (reaction_type = 'heart')
   * - uniqueMentorsCount (distinct normalized mentor_name among approved messages)
   * Strictly uses real database figures (never fabricates fake numbers).
   */
  async getCommunityStatistics() {
    if (!this.client) {
      return {
        totalApprovedMessages: 0,
        totalHeartReactions: 0,
        uniqueMentorsCount: 0,
        fromCloud: false,
        error: getSupabaseStatus().message,
      };
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
        return {
          totalApprovedMessages: 0,
          totalHeartReactions: 0,
          uniqueMentorsCount: 0,
          fromCloud: false,
          error:
            messagesRes.error.message || 'Không thể tải thống kê lời cảm ơn từ cơ sở dữ liệu.',
        };
      }

      const approvedRows = Array.isArray(messagesRes.data)
        ? messagesRes.data.filter((row) => row && row.is_approved === true)
        : [];

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
    } catch (err) {
      return {
        totalApprovedMessages: 0,
        totalHeartReactions: 0,
        uniqueMentorsCount: 0,
        fromCloud: false,
        error: err?.message || 'Lỗi kết nối mạng khi tải thống kê bầu trời tri ân.',
      };
    }
  }

  /**
   * Subscribe to Realtime updates for newly approved messages (`is_approved = true`).
   * Prevents duplicate channels by reusing `this.activeChannel`.
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
        subscriberEntry.onStatusChange('UNCONFIGURED');
      }
      return () => {
        this.channelCallbacks.delete(subscriberEntry);
      };
    }

    // Prevent duplicate Realtime subscriptions
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

      // If UPDATE, only trigger if it transitioned to approved or content updated while approved
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

