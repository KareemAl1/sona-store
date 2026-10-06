import { useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

/** Cosmetic, interruptible motion. Content is always visible and controls never wait. */
export function useEditorialMotion(pathname: string) {
  const surface = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const seen = useRef(new WeakMap<Element, string>());
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = surface.current;
    if (!root) return;
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const value = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      if (progress.current) progress.current.style.transform = `scaleX(${value})`;
    };
    const scheduleProgress = () => { if (!frame) frame = requestAnimationFrame(updateProgress); };
    updateProgress();
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress);
    const resize = new ResizeObserver(scheduleProgress);
    resize.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', scheduleProgress);
      window.removeEventListener('resize', scheduleProgress);
    };
  }, [pathname]);

  useEffect(() => {
    const root = surface.current;
    if (!root) return;
    const elements = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
    const active = new Map<HTMLElement, Animation>();
    if (reduced || !('IntersectionObserver' in window)) {
      elements.forEach(element => seen.current.set(element, pathname));
      return;
    }
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        if (seen.current.get(element) === pathname) continue;
        seen.current.set(element, pathname);
        // A route/anchor's focus target must stay still for keyboard and history navigation.
        const focused = document.activeElement;
        if (focused && focused !== document.body && (element.contains(focused) || focused.contains(element))) continue;
        const title = element.dataset.reveal === 'title';
        const animation = element.animate([
          { opacity: title ? .72 : .65, transform: `translateY(${mobile ? 10 : title ? 22 : 18}px)` },
          { opacity: 1, transform: 'none' },
        ], { duration: title ? (mobile ? 620 : 820) : (mobile ? 440 : 660), easing: 'cubic-bezier(.22,1,.36,1)' });
        animation.id = 'sona-editorial-reveal';
        active.set(element, animation);
        animation.onfinish = () => active.delete(element);
      }
    }, { threshold: .12, rootMargin: '0px 0px -2% 0px' });
    elements.forEach(element => observer.observe(element));
    const stopForFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      for (const [element, animation] of active) {
        if (element.contains(event.target) || event.target.contains(element)) {
          animation.cancel();
          active.delete(element);
        }
      }
    };
    root.addEventListener('focusin', stopForFocus);
    return () => {
      observer.disconnect();
      active.forEach(animation => animation.cancel());
      root.removeEventListener('focusin', stopForFocus);
    };
  }, [pathname, reduced]);

  return { surface, progress };
}
