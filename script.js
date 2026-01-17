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
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
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

// Animate counters when they come into view
const statNumbers = document.querySelectorAll('.stat-number');
// #region agent log
fetch('http://127.0.0.1:7243/ingest/d6f6280a-18f1-48d0-9250-4dc5946d3f55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:100',message:'StatsObserver init',data:{statCount:statNumbers.length,statValues:Array.from(statNumbers).map(s=>s.textContent)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d6f6280a-18f1-48d0-9250-4dc5946d3f55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:103',message:'StatsObserver entry',data:{isIntersecting:entry.isIntersecting,textContent:entry.target.textContent,parentOpacity:entry.target.parentElement?.style.opacity||'not-set',sectionOpacity:entry.target.closest('section')?.style.opacity||'not-set'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (entry.isIntersecting) {
      const target = entry.target;
      const value = target.textContent;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d6f6280a-18f1-48d0-9250-4dc5946d3f55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:107',message:'StatsObserver processing',data:{value:value,hasSlash:value.includes('/'),hasPercent:value.includes('%'),hasPlus:value.includes('+')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
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
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/d6f6280a-18f1-48d0-9250-4dc5946d3f55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:133',message:'Percentage animation starting',data:{number:number,originalValue:value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
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
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/d6f6280a-18f1-48d0-9250-4dc5946d3f55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:148',message:'Percentage animation complete',data:{finalValue:target.textContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/d6f6280a-18f1-48d0-9250-4dc5946d3f55',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:192',message:'Observing stat',data:{textContent:stat.textContent,parentSection:stat.closest('section')?.id||'none',sectionOpacity:stat.closest('section')?.style.opacity||'not-set'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
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