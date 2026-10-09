import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Configure ScrollTrigger globally for optimal mobile performance
ScrollTrigger.config({
  ignoreMobileResize: true,
});

/**
 * Shared smooth-scroll instance. Imported for side effects by every page
 * script BEFORE any ScrollTrigger is created, so pinning inside the
 * transformed content resolves to transform-based pinning.
 *
 * Skipped on touch devices: native momentum scrolling feels better there and
 * avoids address-bar / transform jank with pinned sections.
 */
const isTouch =
  typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches;

export const smoother = isTouch
  ? undefined
  : ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.1,
      effects: false,
    });

export { gsap, ScrollTrigger };
