'use client';

import { useEffect, useState } from 'react';

/**
 * LevelUp mascot slot: still image everywhere; WebM with alpha where the
 * browser can show it (Chromium/Firefox). Safari keeps the still.
 */
export function LiveMedia({
  videoSrc,
  stillSrc,
  alt = '',
  className,
  preload = 'none',
  eager = false,
}: {
  videoSrc: string;
  stillSrc: string;
  alt?: string;
  className?: string;
  preload?: 'none' | 'auto' | 'metadata';
  eager?: boolean;
}) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|CriOS|FxiOS/.test(ua);
    if (safari) return;
    setLive(true);
  }, []);

  const classes = [className, 'ia-live', live ? 'has-live' : null].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {live && (
        <video className="live" autoPlay muted loop playsInline preload={preload} aria-hidden={alt ? undefined : true}>
          <source src={videoSrc} type="video/webm" />
        </video>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="still"
        src={stillSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : undefined}
      />
    </span>
  );
}
