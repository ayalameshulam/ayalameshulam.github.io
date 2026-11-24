(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth < 900;

  /* ---------- fit the 1440 canvas ---------- */
  function fit() {
    const z = isMobile() ? 1 : Math.min(1, innerWidth / 1440);
    document.documentElement.style.setProperty('--z', z);
    // scale fixed-size stages to their box on mobile
    $$('.stage').forEach(st => {
      const w = +st.dataset.w, h = +st.dataset.h;
      if (isMobile()) {
        const box = st.parentElement.clientWidth;
        const s = box / w;
        st.style.transform = `scale(${s})`;
        st.style.transformOrigin = '0 0';
      } else st.style.transform = '';
    });
  }
  fit();
  addEventListener('resize', fit);

  /* ---------- intro ---------- */
  const start = () => requestAnimationFrame(() => document.body.classList.add('loaded'));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 1200);
  const heroImg = $('.hero-phones img');
  setTimeout(() => heroImg.classList.add('float'), 1700);

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      if (el.classList.contains('stat')) runStat(el);
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.r, .topics, .flow-stage, .conn').forEach(el => io.observe(el));
  // ?static → reveal everything at once (used for full-page snapshots)
  if (location.search.includes('static')) $$('.r, .topics, .flow-stage, .conn').forEach(el => {
    el.classList.add('in'); if (el.classList.contains('stat')) runStat(el);
  });

  /* ---------- donut stats ---------- */
  const C = 2 * Math.PI * 78;
  function runStat(el) {
    const v = +el.dataset.v;
    const arc = $('.arc', el), num = $('.val b', el);
    setTimeout(() => { arc.style.strokeDashoffset = C * (1 - v / 100); }, 30);
    if (reduce) { num.textContent = v; arc.style.strokeDashoffset = C * (1 - v / 100); return; }
    const t0 = performance.now() + 300, dur = 1800;
    const tick = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      const e = 1 - Math.pow(1 - p, 4);
      num.textContent = Math.round(v * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- scroll-driven bits ---------- */
  const bar = $('.progress span');
  const pars = $$('.img-card .par');
  const word = $('#adminWord');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      if (reduce || isMobile()) return;
      const vh = innerHeight;
      pars.forEach(p => {
        const r = p.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const c = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        p.style.translate = `0 ${(-c * 22).toFixed(1)}px`;
      });
      if (word) {
        const r = word.parentElement.getBoundingClientRect();
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        word.style.transform = `translateX(${(c * 120).toFixed(1)}px)`;
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- hero: mouse parallax + light ---------- */
  const hero = $('#hero'), card = $('.hero-card');
  if (!reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');
      heroImg.style.setProperty('--px', ((x - .5) * -18).toFixed(1) + 'px');
      heroImg.style.setProperty('--py', ((y - .5) * -14).toFixed(1) + 'px');
    });
    hero.addEventListener('pointerleave', () => {
      heroImg.style.setProperty('--px', '0px');
      heroImg.style.setProperty('--py', '0px');
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce) $$('.magnetic').forEach(b => {
    b.style.transition += ', translate .35s cubic-bezier(.22,1,.36,1)';
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      b.style.translate = `${x * .18}px ${y * .28}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  /* ---------- goals orbit ---------- */
  const orbit = $('#orbit');
  if (orbit && !reduce) {
    const pills = $$('.gp', orbit);
    let a = 0, last = performance.now(), boost = 0, lastY = scrollY;
    addEventListener('scroll', () => { boost += Math.abs(scrollY - lastY) * .004; lastY = scrollY; }, { passive: true });
    const spin = (t) => {
      const dt = Math.min(50, t - last); last = t;
      boost *= .94;
      a = (a + dt * (0.004 + boost * .02)) % 360;
      orbit.style.transform = `rotate(${a}deg)`;
      pills.forEach(p => p.style.transform = `rotate(${-a}deg)`);
      requestAnimationFrame(spin);
    };
    requestAnimationFrame(spin);
  }

  /* ---------- draggable topic chips ---------- */
  const stage = $('#topics .stage');
  $$('.tp', stage).forEach((tp, i) => {
    tp.style.setProperty('--i', i);
    let sx, sy, ox = 0, oy = 0, k = 1, moved = false;
    tp.addEventListener('pointerdown', (e) => {
      tp.setPointerCapture(e.pointerId);
      k = stage.getBoundingClientRect().width / 554 || 1;
      sx = e.clientX; sy = e.clientY; moved = false;
      tp.classList.add('drag');
    });
    tp.addEventListener('pointermove', (e) => {
      if (!tp.classList.contains('drag')) return;
      const dx = (e.clientX - sx) / k, dy = (e.clientY - sy) / k;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      // keep inside the card
      const nx = Math.max(-tp.offsetLeft, Math.min(554 - tp.offsetLeft - tp.offsetWidth, ox + dx));
      const ny = Math.max(-tp.offsetTop + 10, Math.min(613 - tp.offsetTop - tp.offsetHeight, oy + dy));
      tp.style.translate = `${nx}px ${ny}px`;
      tp._n = [nx, ny];
    });
    const end = () => {
      if (!tp.classList.contains('drag')) return;
      tp.classList.remove('drag');
      if (tp._n) [ox, oy] = tp._n;
    };
    tp.addEventListener('pointerup', end);
    tp.addEventListener('pointercancel', end);
  });

  /* ---------- GIF-style app walkthroughs ---------- */
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const FX = {
    fade: [[{ opacity: 0 }, { opacity: 1 }], 420],
    up:   [[{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], 620],
    pop:  [[{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'scale(1)' }], 420],
    push: [[{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }], 620],
  };
  $$('[data-flow]').forEach(player => {
    const shots = $$('.fp', player), tap = $('.tap', player);
    const bar = player.closest('.card').querySelector('.fp-bar');
    const label = $('.fp-label', bar), dotsWrap = $('.fp-dots', bar);
    dotsWrap.innerHTML = shots.map(() => '<i></i>').join('');
    const dots = $$('i', dotsWrap);
    let step = 0, timers = [], playing = false;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clear = () => { timers.forEach(clearTimeout); timers = []; };

    function paint(i, animate) {
      const prev = step, next = shots[i];
      step = i;
      shots.forEach(s => s.getAnimations().forEach(a => a.finish()));
      shots.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('prev', k === prev && k !== i); });
      if (animate && prev !== i && !reduce) {
        const [kf, dur] = FX[i === 0 ? 'fade' : (next.dataset.fx || 'fade')];
        next.animate(kf, { duration: dur, easing: EASE }).finished
          .then(() => shots[prev].classList.remove('prev')).catch(() => {});
      } else if (shots[prev]) shots[prev].classList.remove('prev');
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      label.textContent = next.dataset.label || '';
    }

    function run(i, animate = true) {
      clear();
      tap.classList.remove('show', 'press');
      paint(i, animate);
      if (!playing) return;
      const s = shots[i], hold = +s.dataset.hold || 1700;
      if (s.dataset.tap) {
        const [x, y] = s.dataset.tap.split(',').map(Number);
        later(() => { tap.style.left = x + 'px'; tap.style.top = y + 'px'; tap.classList.add('show'); }, hold - 800);
        later(() => tap.classList.add('press'), hold - 320);
        later(() => tap.classList.remove('show', 'press'), hold - 60);
      }
      later(() => run((i + 1) % shots.length), hold);
    }
    const play = () => { if (playing) return; playing = true; run(step, false); };
    const pause = () => { playing = false; clear(); tap.classList.remove('show', 'press'); };

    paint(0, false);
    dots.forEach((d, k) => d.addEventListener('click', () => run(k)));
    if (!reduce) new IntersectionObserver(([e]) => e.isIntersecting ? play() : pause(), { threshold: .45 }).observe(player);
  });
  /* ---------- swatches: copy hex ---------- */
  const toast = $('#toast');
  let tt;
  $$('.sw').forEach(sw => sw.addEventListener('click', () => {
    const hex = sw.dataset.hex;
    (navigator.clipboard ? navigator.clipboard.writeText(hex) : Promise.reject()).catch(() => {});
    toast.textContent = `${hex} copied`;
    toast.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('show'), 1600);
  }));
})();
