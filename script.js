// Enforce HTTPS + preferred hostname + no /index.html (skip local/dev).
(() => {
  const { protocol, hostname, pathname, search, hash } = window.location;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.test') ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('172.17.') ||
    hostname.startsWith('172.18.') ||
    hostname.startsWith('172.19.') ||
    hostname.startsWith('172.2') ||
    hostname.startsWith('172.30.') ||
    hostname.startsWith('172.31.') ||
    protocol === 'file:';

  if (protocol === 'file:') {
    const normalizedPath = pathname.replace(/\\/g, '/');
    const inBlogPosts = normalizedPath.includes('/blog-posts/');
    const rootPrefix = inBlogPosts ? '../' : '';

    document.querySelectorAll('a[href^="/"]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href === '/') {
        link.setAttribute('href', `${rootPrefix}index.html`);
        return;
      }

      if (href.startsWith('/#')) {
        link.setAttribute('href', `${rootPrefix}index.html${href.slice(1)}`);
        return;
      }

      link.setAttribute('href', `${rootPrefix}${href.slice(1)}`);
    });

    document
      .querySelectorAll('link[rel~="icon"][href^="/"], link[rel="apple-touch-icon"][href^="/"]')
      .forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        link.setAttribute('href', `${rootPrefix}${href.slice(1)}`);
      });

    return;
  }

  if (isLocalHost) {
    return;
  }

  const preferredHost = 'lambagentic.com';
  let normalizedPath = pathname;

  if (normalizedPath.endsWith('/index.html')) {
    normalizedPath = normalizedPath.slice(0, -'/index.html'.length) || '/';
    if (!normalizedPath.endsWith('/')) {
      normalizedPath += '/';
    }
  }

  const needsRedirect =
    protocol !== 'https:' ||
    hostname !== preferredHost ||
    normalizedPath !== pathname;

  if (needsRedirect) {
    const targetUrl = `https://${preferredHost}${normalizedPath}${search}${hash}`;
    window.location.replace(targetUrl);
  }
})();

// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  
  // Animate hamburger menu
  const bars = navToggle.querySelectorAll('.bar');
  bars.forEach((bar, index) => {
    if (navMenu.classList.contains('active')) {
      if (index === 0) bar.style.transform = 'rotate(45deg) translate(5px, 5px)';
      if (index === 1) bar.style.opacity = '0';
      if (index === 2) bar.style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
      bar.style.transform = 'none';
      bar.style.opacity = '1';
    }
  });
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    const bars = navToggle.querySelectorAll('.bar');
    bars.forEach(bar => {
      bar.style.transform = 'none';
      bar.style.opacity = '1';
    });
  });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') {
      return;
    }

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    navbar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
  }
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .solution-card, .stat-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Counter animation for stats
const animateCounter = (element, target, duration = 2000) => {
  let start = 0;
  const increment = target / (duration / 16);
  
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
};

(function () {
  // Determine where index.html is relative to current page
  const path = window.location.pathname.replace(/\\/g, "/");
  const file = path.split("/").pop().toLowerCase();

  // homepage if index.html or "/" (some servers)
  const onHome = file === "" || file === "index.html";

  // blog posts are usually /blog-posts/...
  const inBlogPosts = path.toLowerCase().includes("/blog-posts/");

  // Prefix to reach index.html
  const prefix = onHome ? "" : (inBlogPosts ? "../" : "");

  // Use #anchors on home, otherwise link to index.html#anchor
  const toHomeAnchor = (anchor) => (onHome ? `#${anchor}` : `${prefix}index.html#${anchor}`);

  document.querySelectorAll('[data-nav]').forEach(a => {
    const anchor = a.getAttribute('data-nav');
    a.setAttribute('href', toHomeAnchor(anchor));
  });

  // Make logo/home link consistent too
  const homeLink = document.querySelector('[data-home-link]');
  if (homeLink) homeLink.setAttribute('href', onHome ? "#home" : `${prefix}index.html#home`);
})();


// Animate counters when they come into view
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      const value = target.textContent;
      
      // Special handling for "24/7" format
      if (value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 2) {
          const leftNum = parseInt(parts[0]);
          const rightNum = parseInt(parts[1]);
          
          if (!isNaN(leftNum) && !isNaN(rightNum)) {
            // Create spans for each part
            target.innerHTML = `<span class="left-num">0</span>/<span class="right-num">0</span>`;
            const leftSpan = target.querySelector('.left-num');
            const rightSpan = target.querySelector('.right-num');
            
            setTimeout(() => {
              // Animate both numbers simultaneously
              animateCounter(leftSpan, leftNum);
              animateCounter(rightSpan, rightNum);
            }, 500);
            
            statsObserver.unobserve(target);
            return;
          }
        }
      }
      
      // Handle percentage values
      if (value.includes('%')) {
        const number = parseInt(value.replace(/\D/g, ''));
        if (!isNaN(number)) {
          target.textContent = '0%';
          setTimeout(() => {
            // Animate with percentage preserved
            let start = 0;
            const increment = number / (1400 / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= number) {
                target.textContent = number + '%';
                clearInterval(timer);
              } else {
                target.textContent = Math.floor(start) + '%';
              }
            }, 16);
          }, 500);
        }
        statsObserver.unobserve(target);
        return;
      }
      
      // Handle plus values (like "50+")
      if (value.includes('+')) {
        const number = parseInt(value.replace(/\D/g, ''));
        if (!isNaN(number)) {
          target.textContent = '0';
          setTimeout(() => {
            animateCounter(target, number);
            setTimeout(() => {
              target.textContent = number + '+';
            }, 2000);
          }, 500);
        }
        statsObserver.unobserve(target);
        return;
      }
      
      // Handle plain numbers
      const number = parseInt(value.replace(/\D/g, ''));
      if (!isNaN(number) && value === number.toString()) {
        target.textContent = '0';
        setTimeout(() => {
          animateCounter(target, number);
          setTimeout(() => {
            target.textContent = number.toString();
          }, 1400);
        }, 500);
        statsObserver.unobserve(target);
        return;
      }
      
      // For any other format, don't animate
      statsObserver.unobserve(target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(stat => {
  statsObserver.observe(stat);
});

// Add loading states and micro-interactions
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px)';
  });
  
  button.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
  });
});

// Service card hover effects
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-8px)';
    this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
    this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  });
});

// Preload critical resources
const preloadImage = (src) => {
  const img = new Image();
  img.src = src;
};

// Preload logo
preloadImage('LambAgenticLogo.png');

// Section animations removed - only counter animation remains for index.html