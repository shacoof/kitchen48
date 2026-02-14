/**
 * VideoPlayer Component
 * HLS video player using hls.js for non-Safari browsers,
 * native video element for Safari (which supports HLS natively)
 */

import { useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('VideoPlayer');

interface VideoPlayerProps {
  /** HLS stream URL (.m3u8) or regular video URL */
  src: string;
  /** Poster/thumbnail image URL */
  poster?: string | null;
  /** Auto-play on load */
  autoPlay?: boolean;
  /** CSS class for the container */
  className?: string;
  /** Aspect ratio class (default: 16:9) */
  aspectRatio?: string;
}

export function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  className = '',
  aspectRatio = 'aspect-video',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);

    const isHls = src.includes('.m3u8');

    if (!isHls) {
      // Regular video URL — just set src
      video.src = src;
      setIsLoading(false);
      return;
    }

    // Check if browser natively supports HLS (Safari/iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      setIsLoading(false);
      return;
    }

    // Use hls.js for other browsers
    let isMounted = true;

    import('hls.js').then(({ default: Hls }) => {
      if (!isMounted) return;

      if (!Hls.isSupported()) {
        logger.error('HLS not supported in this browser');
        setHasError(true);
        setIsLoading(false);
        return;
      }

      // Clean up previous instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(() => {
            // Auto-play blocked by browser, that's fine
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          logger.error(`HLS fatal error: ${data.type}`);
          setHasError(true);
          setIsLoading(false);

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
    }).catch((err) => {
      if (isMounted) {
        logger.error(`Failed to load hls.js: ${err}`);
        setHasError(true);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  if (!src) return null;

  return (
    <div className={`relative ${aspectRatio} bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center text-white">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm opacity-80">Video unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
}
