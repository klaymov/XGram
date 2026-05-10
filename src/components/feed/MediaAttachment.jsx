import { useState, useEffect, useRef } from 'react';
import { ImageOff, Play, Loader2 } from 'lucide-react';
import { downloadMedia } from '../../services/feed';
import { getMediaType } from '../../utils/messageParser';

export default function MediaAttachment({ message }) {
  const mediaType = getMediaType(message);
  if (!mediaType || mediaType === 'webpage') return null;

  if (mediaType === 'photo') return <PhotoMedia message={message} />;
  if (mediaType === 'video' || mediaType === 'gif') return <VideoMedia message={message} mediaType={mediaType} />;

  return null;
}

function PhotoMedia({ message }) {
  const [src, setSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const url = await downloadMedia(message);
        if (!cancelled && mountedRef.current) {
          setSrc(url);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled && mountedRef.current) {
          setError(true);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [message]);

  if (error) {
    return (
      <div className="w-full h-48 rounded-xl bg-surface-800/50 flex items-center justify-center text-surface-500">
        <ImageOff className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="relative mt-3 rounded-xl overflow-hidden bg-surface-800/30">
      {isLoading && (
        <div className="w-full h-48 flex items-center justify-center animate-skeleton bg-surface-800/50 rounded-xl">
          <Loader2 className="w-6 h-6 text-surface-500 animate-spin" />
        </div>
      )}
      {src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-full max-h-[500px] object-cover rounded-xl transition-opacity duration-300"
          style={{ display: isLoading ? 'none' : 'block' }}
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}

function VideoMedia({ message, mediaType }) {
  const [src, setSrc] = useState(null);
  const [thumbSrc, setThumbSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const mountedRef = useRef(true);

  // Load thumbnail first
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const url = await downloadMedia(message, { thumb: 0 });
        if (!cancelled && mountedRef.current) {
          setThumbSrc(url);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [message]);

  const handlePlay = async () => {
    if (src) {
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    try {
      const url = await downloadMedia(message);
      if (mountedRef.current) {
        setSrc(url);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isPlaying && videoRef.current && src) {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying, src]);

  // Auto-play GIFs
  useEffect(() => {
    if (mediaType === 'gif') {
      handlePlay();
    }
  }, [mediaType]);

  return (
    <div className="relative mt-3 rounded-xl overflow-hidden bg-surface-800/30">
      {isPlaying && src ? (
        <video
          ref={videoRef}
          src={src}
          controls={mediaType !== 'gif'}
          loop={mediaType === 'gif'}
          muted={mediaType === 'gif'}
          autoPlay
          playsInline
          className="w-full max-h-[500px] rounded-xl"
        />
      ) : (
        <div
          className="relative cursor-pointer group"
          onClick={handlePlay}
        >
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              className="w-full max-h-[500px] object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-48 bg-surface-800/50 rounded-xl" />
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-xl">
            {isLoading ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-500/90 backdrop-blur-sm flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
