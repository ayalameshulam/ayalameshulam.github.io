// Site header: background on scroll + full-screen menu (same behaviour as the home page).
(() => {
  const header = document.querySelector('.sh');
  const btn = document.querySelector('.sh-menu');
  const overlay = document.querySelector('.sh-overlay');
  if (!header || !btn || !overlay) return;
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 10);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  const setMenu = (open) => {
    overlay.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  btn.addEventListener('click', () => setMenu(overlay.hidden));
  overlay.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) setMenu(false); });
})();
