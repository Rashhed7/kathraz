import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram, ArrowUpRight, Volume2, VolumeX, Heart, MessageCircle, Send, Bookmark, Play,
} from 'lucide-react';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../config/contact';
import Reveal from './Reveal';

/**
 * Instagram Reels-style player — behaves like the real thing:
 *   • One full-height 9:16 reel in a phone-shaped column
 *   • Vertical scroll / swipe with scroll-snap (one reel per gesture)
 *   • The in-view reel autoplays muted + loops; all others stay paused
 *   • Tap the reel to pause/play, speaker icon to unmute
 *   • Instagram-style action rail (like / comment / share / save) and
 *     caption block — both deep-link to the post on Instagram
 */
export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (e) {
        // Feed stays hidden on failure — the page must not break
      }
    };
    fetchPosts();
    return () => { cancelled = true; };
  }, []);

  // Which slide is in view? (drives autoplay, Instagram-style one-at-a-time)
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || posts.length === 0) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.index));
          }
        });
      },
      { root, threshold: 0.6 }
    );

    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [posts]);

  if (posts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24" aria-label="Instagram reels">
      <Reveal>
        <div className="flex items-end justify-between border-b border-ivory/10 pb-5 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted mb-2">
              <Instagram className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
              Instagram
            </p>
            <h2 className="font-sans text-3xl font-medium text-ivory">
              {INSTAGRAM_HANDLE ? (
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted transition-colors"
                >
                  {INSTAGRAM_HANDLE}
                </a>
              ) : (
                'Reels'
              )}
            </h2>
          </div>
          {INSTAGRAM_URL && (
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-muted hover:text-ivory transition-colors"
            >
              View on Instagram <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </Reveal>

      {/* Reels column — vertical snap scroller, like the Reels tab */}
      <div className="max-w-[420px] mx-auto">
        <div
          ref={scrollerRef}
          role="region"
          aria-label="Scrollable reels"
          className="no-scrollbar snap-y snap-mandatory overflow-y-auto overscroll-y-contain rounded-2xl border border-ivory/15 bg-black h-[72vh] min-h-[460px] max-h-[820px]"
        >
          {posts.map((post, i) => (
            <ReelSlide
              key={post.id}
              post={post}
              index={i}
              total={posts.length}
              active={i === activeIndex}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] text-muted flex items-center justify-center gap-2">
          Scroll or swipe up for the next reel
          <span aria-hidden="true" className="inline-block animate-bounce-soft">↓</span>
        </p>
      </div>
    </section>
  );
}

/* ---------- One full-height reel slide ---------- */

function ReelSlide({ post, index, total, active }) {
  const isVideo = post.media_type === 'video';
  const link = post.link_url || INSTAGRAM_URL || null;
  const handle = INSTAGRAM_HANDLE || '@kathraz';

  return (
    <div
      data-index={index}
      className="relative h-full w-full snap-start snap-always overflow-hidden bg-black"
    >
      {isVideo ? (
        <ReelVideo src={post.image_url} caption={post.caption} active={active} />
      ) : (
        <img
          src={post.image_url}
          alt={post.caption || 'Instagram post'}
          loading={index === 0 ? 'eager' : 'lazy'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Top + bottom scrims for legibility (like Reels) */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

      {/* Position indicator */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-white/90 text-[11px] font-medium bg-black/40 rounded-full px-2.5 py-1">
        <Instagram className="w-3 h-3" />
        {index + 1}/{total}
      </div>

      {/* Action rail — right side, like Reels. Deep-links to the post. */}
      <div className="absolute right-3 bottom-6 z-10 flex flex-col items-center gap-5">
        <RailButton icon={<Heart className="w-6 h-6" />} label="Like on Instagram" href={link} />
        <RailButton icon={<MessageCircle className="w-6 h-6" />} label="Comment on Instagram" href={link} />
        <RailButton icon={<Send className="w-6 h-5" />} label="Share" href={link} />
        <RailButton icon={<Bookmark className="w-5 h-6" />} label="Save on Instagram" href={link} />
      </div>

      {/* Caption block — bottom left, like Reels */}
      <div className="absolute left-3 right-16 bottom-6 z-10 text-left">
        <p className="text-white text-sm font-semibold drop-shadow">{handle}</p>
        {post.caption && (
          <p className="mt-1 text-white/90 text-xs leading-snug line-clamp-2 drop-shadow">
            {post.caption}
          </p>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-white/80 hover:text-white text-[10px] uppercase tracking-[0.15em] transition-colors"
          >
            View on Instagram <ArrowUpRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function RailButton({ icon, label, href }) {
  const cls =
    'p-1 text-white drop-shadow hover:scale-110 active:scale-95 transition-transform duration-200';
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
        {icon}
      </a>
    );
  }
  return <span className={cls} aria-label={label}>{icon}</span>;
}

/**
 * Reel video: autoplays muted + looping ONLY while its slide is in view
 * (the `active` prop). Tap toggles play/pause like the real app; the
 * speaker icon toggles sound.
 */
function ReelVideo({ src, caption, active }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  // Keep the DOM attribute in sync — iOS Safari keys autoplay off it
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  // Play only the reel in view; pause everything else
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().catch(() => {
        // Autoplay refused — retry after the visitor interacts with the page
        const resume = () => {
          v.play().catch(() => {});
          window.removeEventListener('touchstart', resume, { capture: true });
          window.removeEventListener('click', resume, { capture: true });
        };
        window.addEventListener('touchstart', resume, { once: true, capture: true });
        window.addEventListener('click', resume, { once: true, capture: true });
      });
    } else {
      v.pause();
    }
  }, [active]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
        <Instagram className="w-6 h-6 text-white/40" />
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={caption || 'Instagram reel'}
        onClick={togglePlay}
        onCanPlay={() => { if (active) videoRef.current?.play().catch(() => {}); }}
        onError={() => setFailed(true)}
      />

      {/* Paused indicator */}
      {paused && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="p-4 rounded-full bg-black/50">
            <Play className="w-8 h-8 text-white" fill="white" />
          </span>
        </span>
      )}

      {/* Sound toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMuted((m) => !m);
        }}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
        title={muted ? 'Unmute reel' : 'Mute reel'}
        aria-label={muted ? 'Unmute reel' : 'Mute reel'}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </>
  );
}
