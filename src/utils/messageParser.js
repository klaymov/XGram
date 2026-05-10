/**
 * Parse Telegram MessageEntity objects into React-renderable segments.
 * Each segment: { text, type, url?, language? }
 */
export function parseMessageEntities(text, entities) {
  if (!text) return [{ text: '', type: 'plain' }];
  if (!entities || entities.length === 0) {
    return [{ text, type: 'plain' }];
  }

  // Sort entities by offset
  const sorted = [...entities].sort((a, b) => a.offset - b.offset);

  const segments = [];
  let lastOffset = 0;

  for (const entity of sorted) {
    const { offset, length } = entity;

    // Add plain text before this entity
    if (offset > lastOffset) {
      segments.push({
        text: text.slice(lastOffset, offset),
        type: 'plain',
      });
    }

    const entityText = text.slice(offset, offset + length);
    const segment = { text: entityText };

    switch (entity.className) {
      case 'MessageEntityBold':
        segment.type = 'bold';
        break;
      case 'MessageEntityItalic':
        segment.type = 'italic';
        break;
      case 'MessageEntityCode':
        segment.type = 'code';
        break;
      case 'MessageEntityPre':
        segment.type = 'pre';
        segment.language = entity.language || '';
        break;
      case 'MessageEntityUrl':
        segment.type = 'url';
        segment.url = entityText;
        break;
      case 'MessageEntityTextUrl':
        segment.type = 'url';
        segment.url = entity.url;
        break;
      case 'MessageEntityMention':
        segment.type = 'mention';
        break;
      case 'MessageEntityHashtag':
        segment.type = 'hashtag';
        break;
      case 'MessageEntityStrike':
        segment.type = 'strikethrough';
        break;
      case 'MessageEntityUnderline':
        segment.type = 'underline';
        break;
      case 'MessageEntitySpoiler':
        segment.type = 'spoiler';
        break;
      case 'MessageEntityCustomEmoji':
        segment.type = 'custom_emoji';
        segment.documentId = entity.documentId;
        break;
      case 'MessageEntityBlockquote':
        segment.type = 'blockquote';
        break;
      default:
        segment.type = 'plain';
    }

    segments.push(segment);
    lastOffset = offset + length;
  }

  // Add remaining plain text
  if (lastOffset < text.length) {
    segments.push({
      text: text.slice(lastOffset),
      type: 'plain',
    });
  }

  return segments;
}

/**
 * Format a timestamp into a human-readable relative time
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
}

/**
 * Format a number with abbreviations (1.2K, 3.4M, etc.)
 */
export function formatNumber(num) {
  if (!num) return '0';
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
}

/**
 * Determine media type from message
 */
export function getMediaType(message) {
  if (!message?.media) return null;

  const media = message.media;

  if (media.photo) return 'photo';

  if (media.document) {
    const mime = media.document.mimeType || '';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('image/gif') || mime === 'image/gif') return 'gif';
    if (mime.startsWith('audio/')) return 'audio';
    if (media.document.attributes?.some((a) => a.className === 'DocumentAttributeSticker'))
      return 'sticker';
    if (media.document.attributes?.some((a) => a.className === 'DocumentAttributeAnimated'))
      return 'animation';
    return 'document';
  }

  if (media.webpage) return 'webpage';

  return null;
}

/**
 * Extract web preview data from message
 */
export function getWebPreview(message) {
  const webpage = message?.media?.webpage;
  if (!webpage || webpage.className === 'WebPageEmpty') return null;

  return {
    url: webpage.url,
    displayUrl: webpage.displayUrl,
    siteName: webpage.siteName,
    title: webpage.title,
    description: webpage.description,
    hasPhoto: !!webpage.photo,
  };
}

/**
 * Get message views/reactions count
 */
export function getMessageStats(message) {
  return {
    views: message.views || 0,
    forwards: message.forwards || 0,
    replies: message.replies?.replies || 0,
    hasReplies: !!(message.replies?.replies > 0),
  };
}
