import { useState, useEffect } from 'react';
import { TrendingUp, Hash, Users } from 'lucide-react';
import { fetchChannels } from '../../services/feed';
import { downloadAvatar } from '../../services/feed';

export default function RightPanel() {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const chs = await fetchChannels(30);
        if (!cancelled) {
          // Sort by subscriber count or unread
          const sorted = chs.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
          setChannels(sorted.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to load channels for panel:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <aside className="hidden lg:block h-screen sticky top-0 py-4 px-4 overflow-y-auto">
      {/* Search placeholder */}
      <div className="mb-4">
        <div className="relative">
          <input
            id="search-input"
            type="text"
            placeholder="Search channels..."
            className="w-full px-4 py-2.5 pl-10 rounded-full bg-surface-800/60 border border-surface-700/50 text-surface-200 placeholder:text-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all"
          />
          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
        </div>
      </div>

      {/* Active Channels */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-700/30">
          <h2 className="font-bold text-surface-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Your Channels
          </h2>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-skeleton">
                <div className="w-8 h-8 rounded-full bg-surface-800" />
                <div className="flex-1">
                  <div className="h-3.5 w-24 bg-surface-800 rounded-md mb-1" />
                  <div className="h-2.5 w-16 bg-surface-800/60 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-1">
            {channels.map((ch) => (
              <ChannelItem key={ch.id.toString()} channel={ch} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 px-2">
        <p className="text-xs text-surface-600 leading-relaxed">
          XGram is an open-source client that displays your Telegram channel subscriptions in a
          Twitter-like feed. Your data never leaves your browser.
        </p>
      </div>
    </aside>
  );
}

function ChannelItem({ channel }) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (channel.entity) {
      downloadAvatar(channel.entity).then((url) => {
        if (!cancelled && url) setAvatarUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, [channel.entity]);

  const username = channel.entity?.username;

  return (
    <a
      href={username ? `https://t.me/${username}` : '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-800/40 transition-colors group"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={channel.title}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-xs font-semibold">
          {channel.title?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-surface-200 truncate group-hover:text-surface-100 transition-colors">
          {channel.title}
        </p>
        {username && (
          <p className="text-xs text-surface-500 truncate">@{username}</p>
        )}
      </div>
      {channel.unreadCount > 0 && (
        <span className="text-xs bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-medium min-w-[20px] text-center">
          {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
        </span>
      )}
    </a>
  );
}
