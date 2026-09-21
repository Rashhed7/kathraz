import React, { useState, useEffect, useRef } from 'react';
import { Instagram, ArrowUpRight, Volume2, VolumeX } from 'lucide-react';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../config/contact';
import Reveal from './Reveal';

/**
 * Instagram Reels-style feed on the Home page.
 * Posts (videos or images) are uploaded and ordered by the admin
 * (Admin -> Feed Posts). Cards are vertical 9:16 like Reels.
 * Videos autoplay muted + loop (like Instagram); the speaker button
 * unmutes so visitors can hear the reel's audio.
 * Each card carries a "View on Instagram" action that opens the
 * post's link (or the brand profile as fallback) in a new tab.
 */
export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);

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

  if (posts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {posts.map((post, i) => {
          const link = post.link_url || INSTAGRAM_URL || null;
          const isVideo = post.media_type === 'video';
          return (
            <Reveal
              key={post.id}
              delay={(i % 4) * 100}
              variant="scale"
              className="group relative block aspect-[9/16] overflow-hidden bg-charcoal/40 h-full"
            >
              {isVideo ? (
                <ReelVideo src={post.image_url} caption={post.caption} />
              ) : (
                <img
                  src={post.image_url}
                  alt={post.caption || 'Instagram post'}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                />
              )}

              {/* Caption — hover reveal on desktop, sits above the button */}
              {post.caption && (
                <div className="absolute inset-x-0 bottom-0 pb-14 p-3 bg-gradient-to-t from-ivory/40 to-transparent pointer-events-none">
                  <p className="text-[11px] leading-snug text-obsidian opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-3">
                    {post.caption}
                  </p>
                </div>
              )}

              {/* View on Instagram — always visible on touch, hover-reveal on desktop */}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-center gap-1.5 bg-obsidian/95 text-ivory text-[10px] sm:text-[11px] font-medium uppercase tracking-wider py-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 hover:bg-ivory hover:text-obsidian"
                >
                  <Instagram className="w-3.5 h-3.5" /> View on Instagram
                </a>
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Reel video: autoplays muted and looping (Instagram-style).
 * A small speaker toggle lets visitors unmute. Autoplay with sound is
 * blocked by browsers, so muted autoplay is the reliable default.
 */
function ReelVideo({ src, caption }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  // Keep the DOM attribute in sync — iOS Safari keys autoplay off it
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  const tryPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      // Autoplay refused — retry after the visitor interacts with the page
      const resume = () => {
        v.play().catch(() => {});
        window.removeEventListener('touchstart', resume);
        window.removeEventListener('click', resume);
      };
      window.addEventListener('touchstart', resume, { once: true });
      window.addEventListener('click', resume, { once: true });
    });
  };

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-charcoal/60">
        <Instagram className="w-6 h-6 text-muted" />
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={caption || 'Instagram reel'}
        onCanPlay={tryPlay}
        onError={() => setFailed(true)}
      />
      {/* Sound toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMuted((m) => !m);
        }}
        className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-obsidian/90 text-ivory hover:bg-ivory hover:text-obsidian transition-colors"
        title={muted ? 'Unmute reel' : 'Mute reel'}
        aria-label={muted ? 'Unmute reel' : 'Mute reel'}
      >
        {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </>
  );
}
