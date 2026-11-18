const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reel = document.querySelector('.launch-art');
const reelButton = reel.querySelector('.reel-control');
const reelImage = reel.querySelector('img');
const reelProgress = reel.querySelector('.reel-progress span');
const reelCaptions = [...reel.querySelectorAll('.reel-captions span')];
const reelLabels = {
  idle: 'Play launch animation',
  playing: 'Pause launch animation',
  paused: 'Resume launch animation',
  ended: 'Replay launch animation',
};
let reelAnimations = [];

function setReelState(state) {
  reel.dataset.state = state;
  reelButton.setAttribute('aria-label', reelLabels[state]);
}

function playReel() {
  reelAnimations.forEach((animation) => animation.cancel());

  const duration = 9000;
  const pan = reelImage.animate([
    { transform: 'scale(1) translate(0, 0)', easing: 'ease-out' },
    { transform: 'scale(1.1) translate(-2%, 2%)', offset: .34, easing: 'ease-in-out' },
    { transform: 'scale(1.13) translate(-1%, -1%)', offset: .7, easing: 'ease-in-out' },
    { transform: 'scale(1) translate(0, 0)' },
  ], duration);

  const progress = reelProgress.animate([
    { transform: 'scaleX(0)' },
    { transform: 'scaleX(1)' },
  ], { duration, fill: 'forwards' });

  const captionDuration = duration / reelCaptions.length;
  const captions = reelCaptions.map((caption, index) => caption.animate([
    { opacity: 0, transform: 'translateY(10px)' },
    { opacity: 1, transform: 'translateY(0)', offset: .18 },
    { opacity: 1, transform: 'translateY(0)', offset: .8 },
    { opacity: 0, transform: 'translateY(-8px)' },
  ], {
    delay: index * captionDuration + 140,
    duration: captionDuration - 220,
    easing: 'ease-in-out',
  }));

  reelAnimations = [pan, progress, ...captions];
  pan.addEventListener('finish', () => {
    if (reelAnimations[0] === pan) setReelState('ended');
  }, { once: true });
  setReelState('playing');
}

reelButton.addEventListener('click', () => {
  switch (reel.dataset.state) {
    case 'playing':
      reelAnimations.forEach((animation) => animation.pause());
      setReelState('paused');
      break;
    case 'paused':
      reelAnimations.forEach((animation) => animation.play());
      setReelState('playing');
      break;
    default:
      playReel();
  }
});

function updateReelAvailability() {
  reelButton.hidden = reducedMotion.matches || typeof reelImage.animate !== 'function';
  if (reelButton.hidden) {
    reelAnimations.forEach((animation) => animation.cancel());
    reelAnimations = [];
    setReelState('idle');
  }
}

updateReelAvailability();
reducedMotion.addEventListener('change', updateReelAvailability);

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-waiting');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -28px' });

  for (const section of document.querySelectorAll('[data-reveal]')) {
    if (section.getBoundingClientRect().top < window.innerHeight) continue;

    section.classList.add('reveal-waiting');
    observer.observe(section);
  }
}

const motionWalls = document.querySelectorAll('[data-motion-wall]');
const wallVisibility = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.dataset.wallVisible = String(entry.isIntersecting);
    }
  })
  : null;

for (const wall of motionWalls) {
  const tracks = wall.querySelectorAll('.wall-track');

  function sizeTracks() {
    for (const track of tracks) {
      const original = track.firstElementChild;
      const width = original.getBoundingClientRect().width;
      if (width === 0) continue;

      const needed = 1 + Math.ceil(track.parentElement.clientWidth / width);
      track.style.setProperty('--wall-shift', -width + 'px');

      while (track.children.length > needed) track.lastElementChild.remove();
      while (track.children.length < needed) {
        const copy = original.cloneNode(true);
        copy.dataset.copy = '';
        copy.inert = true;
        copy.setAttribute('aria-hidden', 'true');
        track.append(copy);
      }
    }
  }

  function updateWallAvailability() {
    if (reducedMotion.matches) {
      delete wall.dataset.wallReady;
    } else {
      sizeTracks();
      wall.dataset.wallReady = '';
    }
  }

  if (wallVisibility) {
    wall.dataset.wallVisible = 'false';
    wallVisibility.observe(wall);
  }

  if ('ResizeObserver' in window) {
    const resize = new ResizeObserver(() => {
      if (!reducedMotion.matches) sizeTracks();
    });
    for (const track of tracks) resize.observe(track.parentElement);
  } else {
    window.addEventListener('resize', updateWallAvailability);
  }

  reducedMotion.addEventListener('change', updateWallAvailability);
  updateWallAvailability();
}
