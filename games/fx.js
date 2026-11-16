/* 妙搭小站 · 轻量门户动效：无依赖、可离线、尊重减少动态效果 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  function addDecor(name, tag) {
    var el = doc.createElement(tag || 'div');
    el.className = name;
    el.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(el);
    return el;
  }

  function setupProgress() {
    var bar = addDecor('fx-progress');
    var ticking = false;

    function update() {
      var max = root.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
      ticking = false;
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();
  }

  function setupReveal() {
    var selector = [
      '.hub-card',
      '.cards .app-card',
      'main .app-card',
      '.side-block',
      '.dl-card',
      '.panel',
      '.contact',
      '.sec-title'
    ].join(',');
    var items = Array.prototype.slice.call(doc.querySelectorAll(selector));
    if (!items.length) return;

    items.forEach(function (el) { el.classList.add('fx-reveal'); });

    function show(el, delay) {
      if (el.classList.contains('fx-visible')) return;
      el.classList.add('fx-visible');
      if (!motionQuery.matches && typeof el.animate === 'function') {
        el.animate([
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], {
          duration: 620,
          delay: delay || 0,
          easing: 'cubic-bezier(.22, 1, .36, 1)',
          fill: 'backwards'
        });
      }
    }

    if (motionQuery.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { show(el, 0); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      var visibleIndex = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target, Math.min(visibleIndex * 65, 260));
        visibleIndex += 1;
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });

    items.forEach(function (el) { observer.observe(el); });
  }

  function setupSpotlights() {
    if (!finePointer || motionQuery.matches) return;
    var cards = doc.querySelectorAll('.hub-card, .app-card, .dl-card');
    Array.prototype.forEach.call(cards, function (card) {
      var frame = 0;
      var latestEvent = null;

      function paint() {
        if (!latestEvent) return;
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--fx-x', (latestEvent.clientX - rect.left).toFixed(1) + 'px');
        card.style.setProperty('--fx-y', (latestEvent.clientY - rect.top).toFixed(1) + 'px');
        frame = 0;
      }

      card.addEventListener('pointermove', function (event) {
        latestEvent = event;
        if (!frame) frame = window.requestAnimationFrame(paint);
      }, { passive: true });
    });
  }

  function setupAmbient() {
    if (motionQuery.matches || saveData) return;
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) return;

    var canvas = addDecor('fx-ambient', 'canvas');
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      canvas.remove();
      return;
    }

    var width = 0;
    var height = 0;
    var particles = [];
    var frame = 0;
    var lastTime = 0;
    var resizeFrame = 0;

    function makeParticle(randomY) {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + 8,
        radius: .45 + Math.random() * 1.35,
        vx: (Math.random() - .5) * .055,
        vy: -(.025 + Math.random() * .07),
        alpha: .08 + Math.random() * .25,
        phase: Math.random() * Math.PI * 2,
        green: Math.random() > .84
      };
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      var count = width < 600 ? 12 : Math.min(30, Math.max(18, Math.floor(width / 52)));
      particles = [];
      for (var i = 0; i < count; i += 1) particles.push(makeParticle(true));
      resizeFrame = 0;
    }

    function draw(time) {
      if (doc.hidden || motionQuery.matches) {
        frame = 0;
        return;
      }
      frame = window.requestAnimationFrame(draw);
      if (time - lastTime < 32) return;
      var delta = Math.min(40, time - lastTime || 16);
      lastTime = time;
      ctx.clearRect(0, 0, width, height);

      particles.forEach(function (p, index) {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.phase += .0007 * delta;
        if (p.y < -10 || p.x < -12 || p.x > width + 12) particles[index] = makeParticle(false);
        var shimmer = .68 + Math.sin(p.phase) * .32;
        ctx.beginPath();
        ctx.fillStyle = p.green ? 'rgba(70,195,154,' + (p.alpha * shimmer).toFixed(3) + ')' : 'rgba(232,199,122,' + (p.alpha * shimmer).toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function start() {
      if (!frame && !doc.hidden && !motionQuery.matches) {
        lastTime = 0;
        frame = window.requestAnimationFrame(draw);
      }
    }

    function stop() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      ctx.clearRect(0, 0, width, height);
    }

    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) stop(); else start();
    });

    window.addEventListener('resize', function () {
      if (!resizeFrame) resizeFrame = window.requestAnimationFrame(resize);
    }, { passive: true });

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', function (event) {
        if (event.matches) {
          stop();
          canvas.style.display = 'none';
        } else {
          canvas.style.display = '';
          start();
        }
      });
    }

    resize();
    start();
  }

  function init() {
    if (root.classList.contains('fx-ready')) return;
    root.classList.add('fx-js');
    addDecor('fx-backdrop');
    setupProgress();
    setupReveal();
    setupSpotlights();
    setupAmbient();
    root.classList.add('fx-ready');
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
