import { getImage } from 'astro:assets';
import fs from 'node:fs';
import path from 'node:path';

/** One gallery entry as shipped to the client. */
export interface MediaItem {
  type: 'image' | 'video';
  /** Full-size URL (optimized WebP for local images). */
  src: string;
  /** Small thumbnail URL. */
  thumb: string;
  width?: number;
  height?: number;
}

interface ImageVariants {
  full: string;
  thumb: string;
  width?: number;
  height?: number;
}

/** All property images, keyed by basename: `<hash>.png` → ImageMetadata. */
const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/properties/**/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);
const imageByBasename = new Map<string, ImageMetadata>(
  Object.entries(imageModules).map(([p, mod]) => [p.split('/').pop()!, mod.default]),
);

/**
 * Resolves a CMS image path (`/assets/img/<hash>.png`) to optimized WebP
 * variants. Falls back to the raw public path when the file has not been
 * moved into src/assets yet (fresh Keystatic uploads keep working).
 */
export async function resolveImageVariants(
  src: string,
  sizes: { full?: number; thumb?: number } = {},
): Promise<ImageVariants> {
  const metadata = imageByBasename.get(src.split('/').pop() ?? '');
  if (!metadata) return { full: src, thumb: src };

  const [full, thumb] = await Promise.all([
    getImage({ src: metadata, format: 'webp', quality: 80, width: sizes.full ?? 1600 }),
    getImage({ src: metadata, format: 'webp', quality: 75, width: sizes.thumb ?? 240 }),
  ]);
  return { full: full.src, thumb: thumb.src, width: full.attributes.width, height: full.attributes.height };
}

/**
 * Resolves a CMS video path. Prefers the per-property directory
 * `public/videos/<slug>/` when the file exists there at build time.
 */
export function resolveVideo(src: string, slug: string): string {
  const basename = src.split('/').pop() ?? '';
  const local = path.join(process.cwd(), 'public/videos', slug, basename);
  return fs.existsSync(local) ? `/videos/${slug}/${basename}` : src;
}

interface PropertyLike {
  id: string;
  data: {
    gallery?: string[];
    galleryVideos?: string[];
  };
}

/** Builds the full gallery payload for a property: images first, then videos. */
export async function buildMediaPayload(property: PropertyLike): Promise<MediaItem[]> {
  const images = await Promise.all(
    (property.data.gallery ?? []).map(async (src): Promise<MediaItem> => {
      const v = await resolveImageVariants(src);
      return { type: 'image', src: v.full, thumb: v.thumb, width: v.width, height: v.height };
    }),
  );
  const videos = (property.data.galleryVideos ?? []).map(
    (src): MediaItem => ({ type: 'video', src: resolveVideo(src, property.id), thumb: '' }),
  );
  return [...images, ...videos];
}
