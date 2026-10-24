// Smooth Scroll Image Sequence Animation Engine with Ultra-Responsive Cover Canvas & Section Reveals
const TOTAL_FRAMES = 180;
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');

// Frame storage
const images = [];
let loadedCount = 0;

// State management
let currentFrame = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;
const lerpFactor = 0.14; // Smoothness factor

// Format frame index to filename: ezgif-frame-001.png ... ezgif-frame-180.png
function getFramePath(index) {
  const frameNum = String(index + 1).padStart(3, '0');
  return `pics/ezgif-frame-${frameNum}.png`;
}

// Set up High-DPI canvas
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  // High quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Redraw current frame on resize
  renderFrame(Math.round(currentFrame));
}

// Calculate aspect ratio Cover fit for 100% full screen fill on all screen sizes (Ultra-wide to Mobile)
function renderFrame(index) {
  const img = images[index];
  if (!img || !img.complete) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Clear previous frame
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Cover fit math for 100% viewport coverage
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    // Screen is wider than image aspect ratio
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    // Screen is taller than image aspect ratio
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Smooth Animation Loop using Lerp (Linear Interpolation)
function animate() {
  const diff = targetFrame - currentFrame;
  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * lerpFactor;
  } else {
    currentFrame = targetFrame;
  }

  const frameToRender = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrame)));

  if (frameToRender !== lastRenderedFrame) {
    renderFrame(frameToRender);
    lastRenderedFrame = frameToRender;
  }

  requestAnimationFrame(animate);
}

// Calculate target frame index strictly from page scroll position
function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
}

// Preload all 180 image frames
function preloadImages() {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);

    img.onload = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      if (loaderText) loaderText.innerText = `${progress}%`;

      // Draw frame 0 immediately as soon as loaded
      if (i === 0) {
        renderFrame(0);
        lastRenderedFrame = 0;
      }

      // Hide loader once all frames are ready
      if (loadedCount === TOTAL_FRAMES) {
        if (loader) {
          setTimeout(() => {
            loader.classList.add('loaded');
          }, 200);
        }
      }
    };

    img.onerror = () => {
      console.warn(`Failed to load frame ${i + 1}`);
      loadedCount++;
    };

    images.push(img);
  }
}

// Interactivity for Featured Projects Category Filter Tabs
function initFilterTabs() {
  const filterBtns = document.querySelectorAll('.filter-tab');
  const projectCards = document.querySelectorAll('.featured-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'block';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });
}

// IntersectionObserver for Smooth Scroll Reveal Animations on Section Elements
function initScrollReveals() {
  const sections = document.querySelectorAll('section, footer, .section-container, .hero-section, .brands-section, .resend-footer');

  sections.forEach(sec => sec.classList.add('reveal-section'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.08 });

  sections.forEach(sec => observer.observe(sec));
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', handleScroll, { passive: true });

// Initialize
function init() {
  resizeCanvas();
  preloadImages();
  handleScroll();
  initFilterTabs();
  initScrollReveals();
  requestAnimationFrame(animate);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
