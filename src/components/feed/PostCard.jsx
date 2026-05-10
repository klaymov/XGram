import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Repeat2, Eye, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import FormattedText from './FormattedText';
import MediaAttachment from './MediaAttachment';
import { parseMessageEntities, formatTime, formatNumber, getMessageStats } from '../../utils/messageParser';
import { downloadAvatar, fetchReplies } from '../../services/feed';
import RepliesThread from './RepliesThread';

export default function PostCard({ message }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const chat = message._chat || message.chat;
  const stats = getMessageStats(message);
  const segments = parseMessageEntities(message.message, message.entities);

  // Load channel avatar
  useEffect(() => {
    let cancelled = false;
    if (chat) {
      downloadAvatar(chat).then((url) => {
        if (!cancelled && url) setAvatarUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, [chat]);

  const handleToggleReplies = useCallback(async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    setShowReplies(true);
    if (replies.length > 0) return;

    setIsLoadingReplies(true);
    try {
      const result = await fetchReplies(chat, message.id);
      setReplies(result);
    } catch (err) {
      console.error('Failed to load replies:', err);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [showReplies, replies.length, chat, message.id]);

  const channelTitle = chat?.title || 'Unknown Channel';
  const channelUsername = chat?.username ? `@${chat.username}` : '';

  return (
    <article className="px-4 py-4 border-b border-surface-800/60 hover:bg-surface-900/40 transition-colors duration-150 animate-fade-in">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={channelTitle}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-surface-700/50"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-sm">
              {channelTitle.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-semibold text-surface-100 truncate text-[15px]">
              {channelTitle}
            </span>
            {channelUsername && (
              <span className="text-surface-500 text-sm truncate">
                {channelUsername}
              </span>
            )}
            <span className="text-surface-600 text-sm">·</span>
            <span className="text-surface-500 text-sm shrink-0">
              {formatTime(message.date)}
            </span>
          </div>

          {/* Text content */}
          {message.message && (
            <div className="text-surface-200 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              <FormattedText segments={segments} />
            </div>
          )}

          {/* Media */}
          <MediaAttachment message={message} />

          {/* Actions bar */}
          <div className="flex items-center gap-1 mt-3 -ml-2">
            {/* Replies button */}
            {stats.hasReplies && (
              <button
                id={`replies-btn-${message.id}`}
                onClick={handleToggleReplies}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors group text-sm"
              >
                <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>{formatNumber(stats.replies)}</span>
                {showReplies ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Forwards */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-surface-500 text-sm">
              <Repeat2 className="w-4 h-4" />
              <span>{formatNumber(stats.forwards)}</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-surface-500 text-sm">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(stats.views)}</span>
            </div>

            {/* Link to original */}
            {chat?.username && (
              <a
                href={`https://t.me/${chat.username}/${message.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors ml-auto text-sm"
                title="Open in Telegram"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Replies thread */}
          {showReplies && (
            <div className="mt-3 animate-slide-up">
              {isLoadingReplies ? (
                <div className="flex items-center gap-2 py-4 text-surface-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading replies...</span>
                </div>
              ) : (
                <RepliesThread replies={replies} />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
