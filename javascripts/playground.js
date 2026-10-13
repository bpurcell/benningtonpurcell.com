(() => {
  const root = document.documentElement;
  const motionButton = document.querySelector('.motion-toggle');
  const weirdButton = document.querySelector('#weird-button');
  const status = document.querySelector('#play-status');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  let resetTimer;

  function updateMotion() {
    root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
    motionButton.querySelector('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
  }
  motionButton.hidden = preference.matches;
  weirdButton.hidden = false;
  updateMotion();
  motionButton.addEventListener('click', () => {
    paused = !paused;
    updateMotion();
  });
  preference.addEventListener('change', () => {
    paused = preference.matches;
    motionButton.hidden = preference.matches;
    updateMotion();
  });
  weirdButton.addEventListener('click', () => {
    clearTimeout(resetTimer);
    document.querySelectorAll('.confetti').forEach(item => item.remove());
    root.classList.add('is-weird');
    status.textContent = 'A little extra weirdness: cosmic colors and a sky full of flying shapes.';
    if (!paused && !preference.matches) {
      const shapes = ['star', 'plane', 'planet'];
      const colors = ['#f85b32', '#b8a0ed', '#a5ba76', '#f2a9c2'];
      for (let i = 0; i < 22; i++) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        const shape = shapes[i % shapes.length];
        svg.setAttribute('viewBox', shape === 'planet' ? '0 0 160 110' : shape === 'plane' ? '0 0 140 100' : '0 0 100 100');
        use.setAttribute('href', `#${shape}`);
        svg.append(use);
        svg.classList.add('confetti');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.setProperty('--size', `${30 + Math.random() * 75}px`);
        svg.style.setProperty('--top', `${Math.random() * 105}%`);
        svg.style.setProperty('--color', colors[i % colors.length]);
        svg.style.setProperty('--duration', `${3 + Math.random() * 4}s`);
        svg.style.animationDelay = `${Math.random() * .6}s`;
        document.body.append(svg);
        svg.addEventListener('animationend', () => svg.remove(), { once: true });
      }
    }
    resetTimer = setTimeout(() => {
      root.classList.remove('is-weird');
      document.querySelectorAll('.confetti').forEach(item => item.remove());
      status.textContent = '';
    }, 8500);
  });
  // One scheduled frame per scroll/pointer update; the browser owns scrolling.
  const lab = document.querySelector('.scroll-lab');
  const stage = document.querySelector('.lab-stage');
  const path = document.querySelector('.flight-path path');
  const pathLength = path.getTotalLength();
  const hero = document.querySelector('.hero');
  const about = document.querySelector('.about');
  const projects = [...document.querySelectorAll('.project')];
  let frame = 0;
  let geometry;
  let pointerX = 0;
  let pointerY = 0;
  let lastScroll = window.scrollY;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  function layoutTop(element) {
    let top = 0;
    for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  }
  function measure() {
    geometry = {
      height: window.innerHeight,
      total: Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
      heroHeight: hero.offsetHeight,
      labTop: layoutTop(lab),
      journeyLength: Math.max(1, lab.offsetHeight - stage.offsetHeight),
      aboutTop: layoutTop(about),
      projectTops: projects.map(layoutTop),
    };
    schedule();
  }
  function render() {
    frame = 0;
    const y = window.scrollY;
    root.classList.toggle('scrolled', y > 160);
    root.style.setProperty('--page-progress', clamp(y / geometry.total));
    if (paused || preference.matches) return;
    root.style.setProperty('--hero-scroll', clamp(y / geometry.heroHeight));
    root.style.setProperty('--scroll-y', y);
    root.style.setProperty('--scroll-lean', clamp((y - lastScroll) / 12, -2, 2));
    root.style.setProperty('--pointer-x', pointerX);
    root.style.setProperty('--pointer-y', pointerY);
    root.style.setProperty('--about-turn', (y - geometry.aboutTop + geometry.height) * .35);
    const progress = clamp((y - geometry.labTop) / geometry.journeyLength);
    lab.style.setProperty('--journey', progress);
    const point = path.getPointAtLength(progress * pathLength);
    const before = path.getPointAtLength(Math.max(0, progress * pathLength - 3));
    const after = path.getPointAtLength(Math.min(pathLength, progress * pathLength + 3));
    lab.style.setProperty('--plane-x', `${5 + point.x / 1000 * 90}%`);
    lab.style.setProperty('--plane-y', `${10 + point.y / 500 * 80}%`);
    lab.style.setProperty('--plane-angle', `${Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI + 20}deg`);
    projects.forEach((project, index) => {
      const reveal = clamp((y + geometry.height - geometry.projectTops[index] - index * 35) / (geometry.height * .5));
      project.style.setProperty('--reveal', reveal);
    });
    lastScroll = y;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  motionButton.addEventListener('click', measure);
  preference.addEventListener('change', measure);
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused) return;
    const box = hero.getBoundingClientRect();
    pointerX = (event.clientX - box.left) / box.width * 2 - 1;
    pointerY = (event.clientY - box.top) / box.height * 2 - 1;
    schedule();
  });
  hero.addEventListener('pointerleave', () => {
    pointerX = pointerY = 0;
    schedule();
  });
  projects.forEach(project => {
    project.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || paused) return;
      const box = project.getBoundingClientRect();
      project.style.setProperty('--tilt-x', ((event.clientX - box.left) / box.width - .5) * 2);
      project.style.setProperty('--tilt-y', ((event.clientY - box.top) / box.height - .5) * 2);
    });
    project.addEventListener('pointerleave', () => {
      project.style.setProperty('--tilt-x', 0);
      project.style.setProperty('--tilt-y', 0);
    });
  });
  root.classList.add('motion-ready');
  measure();
  document.fonts.ready.then(measure);
  window.addEventListener('load', measure, { once: true });
})();
