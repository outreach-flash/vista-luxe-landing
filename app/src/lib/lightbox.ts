import type { MediaItem } from './media';

/**
 * Deferred gallery lightbox. This module is loaded via dynamic import() only
 * after the user clicks a gallery trigger, so it ships 0 bytes in the initial
 * page payload. All DOM is built here on first open.
 */

const THUMB_BATCH = 5;

interface LightboxState {
  overlay: HTMLElement;
  stage: HTMLElement;
  rail: HTMLElement;
  counter: HTMLElement;
  sentinel: HTMLElement;
  items: MediaItem[];
  currentIndex: number;
  renderedThumbs: number;
  observer: IntersectionObserver | null;
}

const payloadCache = new Map<string, MediaItem[]>();
let state: LightboxState | null = null;

const PLAY_SVG =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
const PLAY_BADGE =
  `<span class="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">${PLAY_SVG}</span>`;

function el(tag: string, className: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function buildOverlay(): LightboxState {
  const overlay = el(
    'div',
    'fixed inset-0 z-50 hidden items-center justify-center bg-black/85 backdrop-blur-md p-4 opacity-0 transition-opacity duration-300',
  );
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Photo gallery');

  const header = el('div', 'absolute top-4 right-4 z-10 flex items-center gap-4');
  const counter = el('span', 'text-sm font-medium tracking-wide text-white/70');
  const closeBtn = el('button', 'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20');
  closeBtn.setAttribute('aria-label', 'Close gallery');
  closeBtn.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  closeBtn.addEventListener('click', closeGallery);
  header.append(counter, closeBtn);

  const prevBtn = el('button', 'absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:scale-110 hover:bg-white/20');
  prevBtn.setAttribute('aria-label', 'Previous photo');
  prevBtn.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state) showItem(state.currentIndex - 1);
  });

  const nextBtn = el('button', 'absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:scale-110 hover:bg-white/20');
  nextBtn.setAttribute('aria-label', 'Next photo');
  nextBtn.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state) showItem(state.currentIndex + 1);
  });

  const center = el('div', 'flex h-full w-full max-w-5xl flex-col items-center justify-center');
  const stage = el('div', 'relative flex max-h-[75vh] w-full items-center justify-center');
  const rail = el('div', 'mt-4 flex max-w-full gap-2 overflow-x-auto px-2 pb-2 scrollbar-thin');
  center.append(stage, rail);

  overlay.append(header, prevBtn, center, nextBtn);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === center || e.target === stage) closeGallery();
  });

  // Fixed overlays must live outside ScrollSmoother's transformed content.
  document.body.appendChild(overlay);

  document.addEventListener('keydown', (e) => {
    if (!state || state.overlay.classList.contains('opacity-0')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') showItem(state.currentIndex - 1);
    if (e.key === 'ArrowRight') showItem(state.currentIndex + 1);
  });

  return { overlay, stage, rail, counter, sentinel: el('span', 'h-14 w-1 shrink-0'), items: [], currentIndex: 0, renderedThumbs: 0, observer: null };
}

function makeThumb(item: MediaItem, index: number): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className =
    'gallery-thumb relative shrink-0 overflow-hidden rounded-lg border-2 border-transparent opacity-60 transition hover:opacity-100';
  btn.dataset.thumbIndex = String(index);

  if (item.type === 'video') {
    const tile = el('span', 'flex h-14 w-20 items-center justify-center bg-neutral-800 text-white');
    tile.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white" class="drop-shadow"><path d="M8 5.5v13l11-6.5z"/></svg>';
    btn.appendChild(tile);
  } else {
    const img = document.createElement('img');
    img.src = item.thumb;
    img.alt = '';
    img.loading = 'lazy';
    img.className = 'h-14 w-20 object-cover';
    btn.appendChild(img);
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    showItem(index);
  });
  return btn;
}

/** Renders the next batch of thumbnails and re-arms the sentinel. */
function renderThumbBatch(): void {
  if (!state) return;
  const { rail, sentinel, items } = state;
  const end = Math.min(state.renderedThumbs + THUMB_BATCH, items.length);
  for (let i = state.renderedThumbs; i < end; i++) {
    rail.insertBefore(makeThumb(items[i], i), sentinel);
  }
  state.renderedThumbs = end;
  if (end >= items.length) {
    state.observer?.disconnect();
    sentinel.remove();
  }
}

function sentinelInView(): boolean {
  if (!state) return false;
  const s = state.sentinel.getBoundingClientRect();
  const r = state.rail.getBoundingClientRect();
  return s.left < r.right + 200 && s.right > r.left - 200;
}

/**
 * IntersectionObserver only fires on intersection *changes* — when the
 * sentinel stays visible after a batch is appended, no new event comes.
 * Keep filling until the sentinel is pushed out of view or items run out.
 */
function fillWhileVisible(): void {
  while (state && state.renderedThumbs < state.items.length && sentinelInView()) {
    renderThumbBatch();
  }
}

function resetRail(): void {
  if (!state) return;
  const { rail, sentinel } = state;
  rail.innerHTML = '';
  rail.appendChild(sentinel);
  state.renderedThumbs = 0;
  state.observer?.disconnect();

  renderThumbBatch();
  if (state.renderedThumbs < state.items.length) {
    state.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) fillWhileVisible();
      },
      { root: rail, rootMargin: '200px' },
    );
    state.observer.observe(sentinel);
  }
}

function highlightThumb(): void {
  if (!state) return;
  state.rail.querySelectorAll<HTMLElement>('.gallery-thumb').forEach((thumb) => {
    const active = Number(thumb.dataset.thumbIndex) === state!.currentIndex;
    thumb.classList.toggle('opacity-100', active);
    thumb.classList.toggle('border-white', active);
    thumb.classList.toggle('opacity-60', !active);
    thumb.classList.toggle('border-transparent', !active);
    if (active) thumb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

function pauseStageVideo(): void {
  state?.stage.querySelector('video')?.pause();
}

function showItem(index: number): void {
  if (!state || state.items.length === 0) return;
  const { items } = state;
  state.currentIndex = ((index % items.length) + items.length) % items.length;
  const item = items[state.currentIndex];

  pauseStageVideo();
  state.stage.innerHTML = '';

  if (item.type === 'video') {
    // Static placeholder tile; the real player mounts only on an explicit click.
    const tile = el('button', 'group relative flex h-[40vh] w-full items-center justify-center rounded-xl bg-neutral-900 shadow-2xl md:h-[60vh]');
    tile.type = 'button';
    tile.setAttribute('aria-label', 'Play video');
    tile.innerHTML = PLAY_BADGE;
    tile.addEventListener('click', (e) => {
      e.stopPropagation();
      const video = document.createElement('video');
      video.src = item.src;
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = 'metadata';
      video.className = 'max-h-[75vh] max-w-full rounded-xl shadow-2xl';
      tile.replaceWith(video);
    });
    state.stage.appendChild(tile);
  } else {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = '';
    img.className = 'max-h-[75vh] max-w-full select-none rounded-xl object-contain shadow-2xl transition-all duration-200';
    state.stage.appendChild(img);

    const next = items[(state.currentIndex + 1) % items.length];
    if (next?.type === 'image') {
      const prefetch = new Image();
      prefetch.src = next.src;
    }
  }

  state.counter.textContent = `${state.currentIndex + 1} / ${items.length}`;

  // Ensure the active thumb exists (jumped-in indices beyond rendered batches).
  while (state.renderedThumbs <= state.currentIndex && state.renderedThumbs < items.length) {
    renderThumbBatch();
  }
  highlightThumb();
}

function closeGallery(): void {
  if (!state) return;
  pauseStageVideo();
  state.observer?.disconnect();
  state.overlay.classList.remove('opacity-100');
  state.overlay.classList.add('opacity-0');
  document.body.style.overflow = '';
  window.setTimeout(() => {
    state?.overlay.classList.remove('flex');
    state?.overlay.classList.add('hidden');
  }, 300);
}

/** Fetches the payload (cached), builds the overlay once, and opens it. */
export async function openGallery(slug: string, startIndex = 0): Promise<void> {
  let items = payloadCache.get(slug);
  if (!items) {
    const res = await fetch(`/api/media/${encodeURIComponent(slug)}.json`);
    items = (await res.json()) as MediaItem[];
    payloadCache.set(slug, items);
  }
  if (items.length === 0) return;

  if (!state) state = buildOverlay();
  state.items = items;

  resetRail();
  showItem(startIndex);

  state.overlay.classList.remove('hidden');
  state.overlay.classList.add('flex');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    state?.overlay.classList.remove('opacity-0');
    state?.overlay.classList.add('opacity-100');
  });
}
