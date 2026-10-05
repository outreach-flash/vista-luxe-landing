import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/**
 * Shared smooth-scroll instance. Imported for side effects by every page
 * script BEFORE any ScrollTrigger is created, so pinning inside the
 * transformed content resolves to transform-based pinning.
 */
export const smoother = ScrollSmoother.create({
  wrapper: '#smooth-wrapper',
  content: '#smooth-content',
  smooth: 1.1,
  effects: false,
});

export { gsap, ScrollTrigger };
