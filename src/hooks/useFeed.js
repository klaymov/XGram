import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchChannels, fetchFeed } from '../services/feed';

export function useFeed() {
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const channelsRef = useRef([]);

  // Initial load: fetch channels then messages
  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const channelList = await fetchChannels();
      setChannels(channelList);
      channelsRef.current = channelList;

      if (channelList.length === 0) {
        setMessages([]);
        setIsLoading(false);
        setHasMore(false);
        return;
      }

      const msgs = await fetchFeed(channelList, { messagesPerChannel: 10 });
      // Filter out service messages (empty)
      const filteredMsgs = msgs.filter((m) => m.message || m.media);
      setMessages(filteredMsgs);
      setHasMore(filteredMsgs.length > 0);
    } catch (err) {
      console.error('Failed to load feed:', err);
      setError(err.message || 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestDate = messages[messages.length - 1]?.date;
      if (!oldestDate) return;

      const olderMsgs = await fetchFeed(channelsRef.current, {
        messagesPerChannel: 10,
        offsetDate: oldestDate,
      });

      const filteredMsgs = olderMsgs.filter((m) => m.message || m.media);

      // Deduplicate
      const existingIds = new Set(messages.map((m) => `${m.chatId}_${m.id}`));
      const newMsgs = filteredMsgs.filter((m) => !existingIds.has(`${m.chatId}_${m.id}`));

      if (newMsgs.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...prev, ...newMsgs]);
      }
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, messages]);

  // Load on mount
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return {
    channels,
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh: loadFeed,
  };
}
