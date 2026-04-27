/* ================================================
   UNFAZED MOTORS — Intro Animation Driver
   Desktop: scroll-driven
   Mobile: lightweight timed intro for iPhone/Android safety
   ================================================ */

   (function () {
    const intro = document.getElementById('intro');
    const spacer = document.getElementById('introSpacer');
    if (!intro || !spacer) return;
  
    let mobileFinished = false;

    function finishIntro() {
      if (mobileFinished) return;
      mobileFinished = true;
      intro.classList.add('done');
      document.documentElement.classList.add('intro-done');
      window.setTimeout(() => {
        intro.remove();
        spacer.remove();
        document.documentElement.classList.remove('has-intro');
        document.body.style.overflow = '';
      }, 260);
    }

    function skipIntro() {
      intro.remove();
      spacer.remove();
      document.documentElement.classList.remove('has-intro');
      document.documentElement.classList.add('intro-done');
      document.body.style.overflow = '';
    }
  
    function startMobileIntro() {
      document.documentElement.classList.add('has-intro', 'mobile-intro-auto');
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);

      let p = 0;
      const startedAt = performance.now();
      const duration = 1800;

      function tick(now) {
        p = Math.min(1, (now - startedAt) / duration);
        intro.style.setProperty('--p', p.toFixed(4));
        const cueFill = document.getElementById('cueFill');
        if (cueFill) cueFill.style.width = (p * 100).toFixed(1) + '%';
        if (p < 1) requestAnimationFrame(tick);
        else finishIntro();
      }

      requestAnimationFrame(tick);
      intro.addEventListener('click', finishIntro, { once: true });
      intro.addEventListener('touchstart', finishIntro, { once: true, passive: true });
      window.setTimeout(finishIntro, 2800);
    }

    // Reduced motion: skip intro
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      skipIntro();
      return;
    }

    // iPhone / iPad / Android: use a timed intro, not scroll-driven fixed animation.
    // Safari can report hover/pointer values inconsistently, so use multiple signals.
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isTouchPointer =
      window.matchMedia &&
      window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const isSmallViewport =
      window.matchMedia &&
      window.matchMedia('(max-width: 820px)').matches;
    const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    const isMobile = isIOS || isAndroid || (hasTouch && (isTouchPointer || isSmallViewport));
  
    if (isMobile) {
      startMobileIntro();
      return;
    }
  
    const helmetSrc = intro.querySelector('.intro-helmet')?.src;
    const damagedSrc = intro.querySelector('.intro-helmet-damaged')?.src;
    const sources = [helmetSrc, damagedSrc].filter(Boolean);
  
    let loaded = 0;
    let started = false;
  
    function maybeStart() {
      if (started) return;
      started = true;
      startAnim();
    }
  
    function startAnim() {
      document.documentElement.classList.add('has-intro');
  
      if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
      }
  
      window.scrollTo(0, 0);
  
      let done = false;
      let raf = null;
  
      function tick() {
        const rect = spacer.getBoundingClientRect();
        const vh = document.documentElement.clientHeight;
        const scrollable = spacer.offsetHeight - vh;
        const y = Math.max(0, -rect.top);
        const p = scrollable > 0 ? Math.min(1, y / scrollable) : 1;
  
        intro.style.setProperty('--p', p.toFixed(4));
  
        const cueFill = document.getElementById('cueFill');
        if (cueFill) cueFill.style.width = (p * 100).toFixed(1) + '%';
  
        if (p >= 0.995 && !done) {
          done = true;
          intro.classList.add('done');
          document.documentElement.classList.add('intro-done');
        } else if (p < 0.995 && done) {
          done = false;
          intro.classList.remove('done');
          document.documentElement.classList.remove('intro-done');
        }
  
        raf = null;
      }
  
      function schedule() {
        if (raf == null) raf = requestAnimationFrame(tick);
      }
  
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      tick();
  
      // Safety fallback so desktop never gets stuck either
      setTimeout(() => {
        document.documentElement.classList.add('intro-done');
        intro.classList.add('done');
      }, 7000);
    }
  
    if (sources.length === 0) {
      maybeStart();
    } else {
      sources.forEach(src => {
        const img = new Image();
  
        img.onload = () => {
          loaded++;
          if (loaded >= sources.length) maybeStart();
        };
  
        img.onerror = () => {
          loaded++;
          if (loaded >= sources.length) maybeStart();
        };
  
        img.src = src;
      });
  
      setTimeout(maybeStart, 2500);
    }
  })();
