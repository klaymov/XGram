import { Api } from 'telegram/tl';
import telegramService from './telegram';

/**
 * Media blob cache to avoid re-downloading the same files
 */
const mediaBlobCache = new Map();

/**
 * Channel avatar cache
 */
const avatarCache = new Map();

/**
 * Fetch all subscribed channels from user's dialogs
 */
export async function fetchChannels(limit = 100) {
  const client = telegramService.client;
  if (!client) throw new Error('Client not initialized');

  const dialogs = await client.getDialogs({ limit });

  // Filter only channels (not groups, not megagroups used as chats)
  const channels = dialogs.filter((d) => {
    const entity = d.entity;
    return entity?.className === 'Channel' && entity.broadcast;
  });

  return channels.map((d) => ({
    id: d.id,
    entity: d.entity,
    title: d.title,
    unreadCount: d.unreadCount,
  }));
}

/**
 * Fetch messages from a single channel
 */
export async function fetchChannelMessages(channel, options = {}) {
  const client = telegramService.client;
  const { limit = 20, offsetId = 0, offsetDate } = options;

  const messages = await client.getMessages(channel.entity || channel, {
    limit,
    offsetId,
    offsetDate,
  });

  return messages;
}

/**
 * Aggregate feed: fetch recent messages from multiple channels
 */
export async function fetchFeed(channels, options = {}) {
  const { messagesPerChannel = 10, offsetDate } = options;

  const allMessages = [];

  // Fetch in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((ch) =>
        fetchChannelMessages(ch, {
          limit: messagesPerChannel,
          offsetDate,
        })
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allMessages.push(...result.value);
      }
    }
  }

  // Sort by date descending
  allMessages.sort((a, b) => b.date - a.date);

  return allMessages;
}

/**
 * Download media and return a blob URL (cached)
 */
export async function downloadMedia(message, options = {}) {
  const client = telegramService.client;
  if (!client || !message.media) return null;

  const cacheKey = `${message.chatId}_${message.id}_${options.thumb ? 'thumb' : 'full'}`;

  if (mediaBlobCache.has(cacheKey)) {
    return mediaBlobCache.get(cacheKey);
  }

  try {
    const buffer = await client.downloadMedia(message, {
      progressCallback: options.onProgress,
      thumb: options.thumb,
    });

    if (!buffer) return null;

    // Determine MIME type
    let mimeType = 'application/octet-stream';
    if (message.media?.photo) {
      mimeType = 'image/jpeg';
    } else if (message.media?.document) {
      mimeType = message.media.document.mimeType || 'application/octet-stream';
    }

    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);

    mediaBlobCache.set(cacheKey, url);
    return url;
  } catch (err) {
    console.error('Failed to download media:', err);
    return null;
  }
}

/**
 * Download channel avatar
 */
export async function downloadAvatar(entity) {
  const client = telegramService.client;
  if (!client || !entity) return null;

  const cacheKey = `avatar_${entity.id}`;
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey);
  }

  try {
    const buffer = await client.downloadProfilePhoto(entity);
    if (!buffer || buffer.length === 0) return null;

    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    avatarCache.set(cacheKey, url);
    return url;
  } catch (err) {
    console.error('Failed to download avatar:', err);
    return null;
  }
}

/**
 * Fetch replies/comments for a message
 */
export async function fetchReplies(channelEntity, messageId, options = {}) {
  const client = telegramService.client;
  const { limit = 30, offsetId = 0 } = options;

  try {
    // Get the discussion message to find the linked group
    const result = await client.invoke(
      new Api.messages.GetReplies({
        peer: channelEntity,
        msgId: messageId,
        offsetId,
        limit,
        addOffset: 0,
        maxId: 0,
        minId: 0,
        hash: BigInt(0),
      })
    );

    return result.messages || [];
  } catch (err) {
    console.error('Failed to fetch replies:', err);
    return [];
  }
}

/**
 * Clear all media caches (for memory management)
 */
export function clearMediaCache() {
  for (const url of mediaBlobCache.values()) {
    URL.revokeObjectURL(url);
  }
  mediaBlobCache.clear();

  for (const url of avatarCache.values()) {
    URL.revokeObjectURL(url);
  }
  avatarCache.clear();
}
