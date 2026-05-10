import { useRef, useCallback, useEffect } from 'react';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useFeed } from '../../hooks/useFeed';
import PostCard from './PostCard';
import SkeletonPost from './SkeletonPost';

export default function FeedPage() {
  const { messages, isLoading, isLoadingMore, hasMore, error, loadMore, refresh } = useFeed();
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Infinite scroll observer
  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, hasMore, isLoadingMore, loadMore]);

  return (
    <div className="min-h-screen">
      {/* Feed header */}
      <div className="sticky top-0 z-20 glass">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-surface-100">Feed</h1>
          <button
            id="refresh-feed-btn"
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-surface-800/60 text-surface-400 hover:text-surface-200 transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-4 py-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-surface-400 text-sm mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-full bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div>
          {[...Array(5)].map((_, i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      )}

      {/* Messages feed */}
      {!isLoading && !error && messages.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="text-surface-500 text-sm">No posts found. Subscribe to channels in Telegram to see their feed here.</p>
        </div>
      )}

      {!isLoading &&
        messages.map((msg) => (
          <PostCard key={`${msg.chatId}_${msg.id}`} message={msg} />
        ))}

      {/* Load more trigger */}
      {!isLoading && hasMore && (
        <div ref={loadMoreRef} className="py-6 flex justify-center">
          {isLoadingMore && (
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          )}
        </div>
      )}

      {/* End of feed */}
      {!isLoading && !hasMore && messages.length > 0 && (
        <div className="py-8 text-center text-surface-600 text-sm">
          You&apos;ve reached the end of your feed
        </div>
      )}
    </div>
  );
}
