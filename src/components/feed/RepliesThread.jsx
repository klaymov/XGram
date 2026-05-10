import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import FormattedText from './FormattedText';
import { parseMessageEntities, formatTime } from '../../utils/messageParser';
import { downloadAvatar } from '../../services/feed';

export default function RepliesThread({ replies }) {
  if (!replies || replies.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 text-surface-500 text-sm border-l-2 border-surface-700/50 pl-4">
        <MessageCircle className="w-4 h-4" />
        <span>No comments yet</span>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-surface-700/50 pl-3 space-y-0.5">
      {replies.map((reply) => (
        <ReplyItem key={reply.id} reply={reply} />
      ))}
    </div>
  );
}

function ReplyItem({ reply }) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  const sender = reply._sender || reply.sender;
  const segments = parseMessageEntities(reply.message, reply.entities);

  useEffect(() => {
    let cancelled = false;
    if (sender) {
      downloadAvatar(sender).then((url) => {
        if (!cancelled && url) setAvatarUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, [sender]);

  const displayName =
    sender?.firstName
      ? `${sender.firstName}${sender.lastName ? ' ' + sender.lastName : ''}`
      : sender?.title || 'User';

  return (
    <div className="flex gap-2.5 py-2.5 px-2 rounded-lg hover:bg-surface-800/30 transition-colors">
      {/* Mini avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-7 h-7 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-surface-300 text-xs font-medium shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-medium text-surface-200 text-sm truncate">
            {displayName}
          </span>
          <span className="text-surface-600 text-xs">·</span>
          <span className="text-surface-500 text-xs shrink-0">
            {formatTime(reply.date)}
          </span>
        </div>
        {reply.message && (
          <div className="text-surface-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
            <FormattedText segments={segments} />
          </div>
        )}
      </div>
    </div>
  );
}
