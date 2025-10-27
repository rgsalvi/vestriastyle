import React from 'react';

type WeekMeta = {
  date: string; // Friday start, ISO string e.g. 2025-10-31
  title: string;
  description: string[]; // paragraphs
  flatlayAlt: string;
  modelAlt: string;
  slug: string;
  flatlay?: string; // optional file name if not default
  model?: string; // optional file name if not default
};

const ChevronLeft: React.FC<{ className?: string }>=({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || 'h-6 w-6'}><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
);
const ChevronRight: React.FC<{ className?: string }>=({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || 'h-6 w-6'}><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L12.17 12z"/></svg>
);

function formatWeek(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `Week of ${fmt.format(d)}`;
  } catch {
    return `Week of ${dateIso}`;
  }
}

export const RecipeCarousel: React.FC = () => {
  const [slugs, setSlugs] = React.useState<string[] | null>(null);
  const [current, setCurrent] = React.useState(0);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [metaCache, setMetaCache] = React.useState<Record<string, WeekMeta | null>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const centerCardRef = React.useRef<HTMLDivElement>(null);
  const [descFontPx, setDescFontPx] = React.useState<number>(15);
  const touchStartX = React.useRef<number | null>(null);
  const hasMountedRef = React.useRef(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/recipes/index.json', { cache: 'no-cache' });
        const arr = await resp.json();
        if (!Array.isArray(arr) || arr.length === 0) {
          setSlugs([]);
          return;
        }
        // Normalize order: sort by date ascending (oldest -> newest) based on slug prefix YYYY-MM-DD
        const getDateFromSlug = (s: string) => {
          const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
          return m ? new Date(m[1]).getTime() : Number.NaN;
        };
        const sorted = [...arr].sort((a, b) => {
          const da = getDateFromSlug(a);
          const db = getDateFromSlug(b);
          if (isNaN(da) && isNaN(db)) return 0;
          if (isNaN(da)) return 1;
          if (isNaN(db)) return -1;
          return da - db;
        });
        if (mounted) {
          setSlugs(sorted);
          // Start on the latest week by default (last index when ascending)
          setCurrent(Math.max(0, sorted.length - 1));
        }
      } catch (e) {
        console.warn('Failed to load recipes index', e);
        if (mounted) setSlugs([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const loadMeta = React.useCallback(async (slug: string) => {
    if (metaCache[slug] !== undefined) return metaCache[slug];
    try {
      const resp = await fetch(`/recipes/${slug}/meta.json`, { cache: 'no-cache' });
      const meta = await resp.json() as WeekMeta;
      setMetaCache(prev => ({ ...prev, [slug]: meta }));
      return meta;
    } catch (e) {
      console.warn('Failed to load recipe meta', slug, e);
      setMetaCache(prev => ({ ...prev, [slug]: null }));
      return null;
    }
  }, [metaCache]);

  React.useEffect(() => {
    if (!slugs || slugs.length === 0) return;
    // Preload current and neighbors
    const targets = [current, current - 1, current + 1].filter(i => i >= 0 && i < slugs.length).map(i => slugs[i]);
    targets.forEach(s => { loadMeta(s); });
  }, [slugs, current, loadMeta]);

  const onPrev = () => { setDir(-1); setCurrent(c => Math.max(0, c - 1)); };
  const onNext = () => { setDir(1); setCurrent(c => (slugs ? Math.min(slugs.length - 1, c + 1) : c)); };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  };

  const onTouchStart: React.TouchEventHandler = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd: React.TouchEventHandler = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;
    if (dx > threshold) onPrev();
    if (dx < -threshold) onNext();
    touchStartX.current = null;
  };

  const hasSlugs = Array.isArray(slugs) && slugs.length > 0;
  const activeSlug = hasSlugs ? slugs![current] : null;
  const activeMeta = activeSlug ? (metaCache[activeSlug] || null) : null;
  const basePath = activeSlug ? `/recipes/${activeSlug}` : '';
  const flatlay = activeMeta?.flatlay ? `${basePath}/${activeMeta.flatlay}` : (activeSlug ? `${basePath}/flatlay.webp` : '');
  const model = activeMeta?.model ? `${basePath}/${activeMeta.model}` : (activeSlug ? `${basePath}/model.webp` : '');

  const fontClassFor = (px: number) => {
    switch (px) {
      case 11: return 'text-[11px]';
      case 12: return 'text-[12px]';
      case 13: return 'text-[13px]';
      case 14: return 'text-[14px]';
      case 15: default: return 'text-[15px]';
    }
  };

  // Fit description text to available height by shrinking font a bit if needed (down to 11px)
  const fitDescription = React.useCallback(() => {
    const el = centerCardRef.current;
    if (!el) return;
    // Reset to base size before measuring
    let base = 15; // start target in px
    el.className = `h-full overflow-hidden ${fontClassFor(base)}`;
    // Allow layout flush
    const maxShrink = 11;
    // Loop to shrink until fits or min size reached
    // Small safety to avoid long loops
    for (let size = base; size >= maxShrink; size--) {
      el.className = `h-full overflow-hidden ${fontClassFor(size)}`;
      const fits = el.scrollHeight <= el.clientHeight + 1; // +1 for rounding
      if (fits) {
        setDescFontPx(size);
        return;
      }
    }
    setDescFontPx(maxShrink);
  }, []);

  React.useEffect(() => {
    // Run after meta or slide changes
    // Timeout to allow DOM paint
    const t = setTimeout(() => fitDescription(), 0);
    return () => clearTimeout(t);
  }, [current, activeMeta?.slug, activeMeta?.description, fitDescription]);

  React.useEffect(() => {
    const onResize = () => { fitDescription(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitDescription]);

  React.useEffect(() => { hasMountedRef.current = true; }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Weekly Style Recipes"
    >
      {/* Loading / empty states */}
      {!slugs && (
        <div className="py-10 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-platinum" />
        </div>
      )}
      {slugs && slugs.length === 0 && (
        <div className="py-8 text-center text-platinum/70">Weekly style recipes will appear here soon.</div>
      )}

      {hasSlugs && (
      <>
      {/* Arrows */}
      <button
        type="button"
        onClick={onPrev}
        disabled={current === 0}
        aria-label="Previous recipe"
        className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 border border-platinum/30 text-platinum/80 hover:text-white hover:bg-black/50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={slugs && current === slugs.length - 1}
        aria-label="Next recipe"
        className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 border border-platinum/30 text-platinum/80 hover:text-white hover:bg-black/50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight />
      </button>

      <div key={activeSlug || 'empty'} className={`${hasMountedRef.current ? (dir > 0 ? 'animate-slide-in-right' : 'animate-slide-in-left') : ''} motion-reduce:animate-none`}>
        {/* Header: Week + Title */}
        <div className="text-center">
          <div className="text-sm tracking-widest uppercase text-platinum/60">{activeMeta ? formatWeek(activeMeta.date) : '\u00A0'}</div>
          <div className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight">{activeMeta?.title || '\u00A0'}</div>
        </div>

        {/* Panels */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Left: Flat lay */}
        <div className="rounded-2xl border border-platinum/20 bg-dark-blue/70 p-4 h-72 md:h-80 flex items-center justify-center overflow-hidden">
          <div className="image-frame image-vignette image-bg-soft rounded-xl w-full h-full flex items-center justify-center transition-transform duration-300 will-change-transform hover:scale-[1.01]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flatlay}
              alt={activeMeta?.flatlayAlt || 'Flat lay'}
              className="w-full h-full object-cover object-center"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/recipes/placeholder-flatlay.svg'; }}
              loading="lazy"
            />
          </div>
        </div>
        {/* Center: Description */}
        <div className="rounded-2xl border border-platinum/20 bg-dark-blue/70 p-4 md:p-5 h-72 md:h-80 overflow-hidden">
          <div ref={centerCardRef} className={`h-full overflow-hidden ${fontClassFor(descFontPx)}`}>
          {(activeMeta?.description || []).map((p, idx) => {
            const m = /^([^:]+):(.*)$/.exec(p);
            const lead = m ? m[1].trim() : null;
            const rest = m ? m[2].trim() : null;
            return (
              <p key={idx} className={`text-platinum/85 leading-snug ${idx === 0 ? '' : 'mt-2'}`}>
                {lead ? (
                  <>
                    <span className="font-semibold">{lead}</span>
                    {rest ? <>: {rest}</> : null}
                  </>
                ) : (
                  p
                )}
              </p>
            );
          })}
          {(!activeMeta || !activeMeta.description || activeMeta.description.length === 0) && (
            <p className="text-sm text-platinum/60">Detailed styling notes will appear here.</p>
          )}
          </div>
        </div>
        {/* Right: Model */}
        <div className="rounded-2xl border border-platinum/20 bg-dark-blue/70 p-4 h-72 md:h-80 flex items-center justify-center overflow-hidden">
          <div className="image-frame image-vignette image-bg-soft rounded-xl w-full h-full flex items-center justify-center transition-transform duration-300 will-change-transform hover:scale-[1.01]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={model}
              alt={activeMeta?.modelAlt || 'Styled model'}
              className="w-full h-full object-cover object-center"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/recipes/placeholder-model.svg'; }}
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button className="px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold shadow-sm hover:opacity-90">Chat With A Stylist</button>
        <button className="px-5 py-2.5 rounded-full bg-platinum/20 text-platinum border border-platinum/40 font-semibold hover:bg-platinum/30">Try It On!</button>
      </div>
      </div>
      </>
      )}
    </div>
  );
};

export default RecipeCarousel;
