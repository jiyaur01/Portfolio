// Smooth Scroll Image Sequence Animation Engine with Ultra-Responsive Cover Canvas & Section Reveals
const TOTAL_FRAMES = 180;
const canvas = document.getElementById('heroCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
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
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Format frame index to filename: pics/ezgif-frame-001.png ... ezgif-frame-180.png
function getFramePath(index) {
  const frameNum = String(index + 1).padStart(3, '0');
  return `pics/ezgif-frame-${frameNum}.png`;
}

// Set up High-DPI canvas (capped at 2x for optimal mobile GPU performance)
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  if (!canvas || !ctx) return;
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
    // Screen is taller than image aspect ratio (Mobile portrait)
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

// Smooth Animation Loop using Lerp (Linear Interpolation)
function animate() {
  if (canvas && ctx) {
    if (prefersReducedMotion) {
      currentFrame = targetFrame;
    } else {
      const diff = targetFrame - currentFrame;
      if (Math.abs(diff) > 0.001) {
        currentFrame += diff * lerpFactor;
      } else {
        currentFrame = targetFrame;
      }
    }

    const frameToRender = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrame)));

    if (frameToRender !== lastRenderedFrame) {
      renderFrame(frameToRender);
      lastRenderedFrame = frameToRender;
    }
  }

  requestAnimationFrame(animate);
}

// Calculate target frame index strictly from page scroll position & update header / nav state
function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  if (canvas && ctx) {
    const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
    targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
  }

  // Header background on scroll
  const header = document.querySelector('.header');
  if (header) {
    if (scrollTop > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  // Active navigation link highlighting (Scrollspy)
  updateActiveNavLink();
}

// Preload all 180 image frames
function preloadImages() {
  if (!canvas || !ctx) {
    if (loader) loader.classList.add('loaded');
    return;
  }

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
          }, 150);
        }
      }
    };

    img.onerror = () => {
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES && loader) {
        loader.classList.add('loaded');
      }
    };

    images.push(img);
  }
}

// Mobile Navigation Toggle Controller
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');
  const navBackdrop = document.getElementById('navBackdrop');
  const navLinks = document.querySelectorAll('.nav-menu .nav-item');

  if (!navToggle || !navMenu) return;

  function openMenu() {
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    navMenu.classList.add('open');
    if (navBackdrop) navBackdrop.classList.add('active');
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('open');
    if (navBackdrop) navBackdrop.classList.remove('active');
    document.body.classList.remove('menu-open');
  }

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (navMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMenu);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

// Scrollspy: update active nav link based on scroll position
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu .nav-item');
  if (!sections.length || !navLinks.length) return;

  let currentSectionId = '';
  const scrollPos = window.scrollY + 120;

  sections.forEach(sec => {
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
      currentSectionId = sec.getAttribute('id');
    }
  });

  if (currentSectionId) {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${currentSectionId}` || href.endsWith(`#${currentSectionId}`)) {
        link.classList.add('active');
      } else if (href.startsWith('#')) {
        link.classList.remove('active');
      }
    });
  }
}

// Interactivity for Featured Projects Category Filter Tabs
function initFilterTabs() {
  const filterBtns = document.querySelectorAll('.filter-tab');
  const projectCards = document.querySelectorAll('.featured-card');
  if (!filterBtns.length) return;

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

// Testimonials Carousel Controls (Arrows and Pagination Dots)
function initTestimonials() {
  const cards = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.dots-pagination .dot');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (!cards.length) return;

  let activeIndex = 0;

  function setActive(index) {
    if (index < 0) index = cards.length - 1;
    if (index >= cards.length) index = 0;
    activeIndex = index;

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });

    // On mobile screens where cards stack or user navigates via controls:
    if (window.innerWidth <= 900) {
      cards.forEach((card, i) => {
        if (i === activeIndex) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          card.style.borderColor = 'var(--primary-color)';
        } else {
          card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }
      });
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => setActive(activeIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => setActive(activeIndex + 1));
  }
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => setActive(i));
  });
}

// IntersectionObserver for Smooth Scroll Reveal Animations on Section Elements
function initScrollReveals() {
  const sections = document.querySelectorAll('section, footer, .section-container, .hero-section, .brands-section, .resend-footer');
  if (!sections.length) return;

  sections.forEach(sec => sec.classList.add('reveal-section'));

  if (prefersReducedMotion) {
    sections.forEach(sec => sec.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

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
  initMobileNav();
  initFilterTabs();
  initTestimonials();
  initScrollReveals();
  if (canvas && ctx) {
    requestAnimationFrame(animate);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
