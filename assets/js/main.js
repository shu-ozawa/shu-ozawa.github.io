// Main JavaScript for the portfolio website

class PortfolioSite {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupSmoothScrolling();
        this.setupClock();
        this.setupAnimations();
    }

    // Navigation functionality
    setupNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                this.toggleHamburger(navToggle);
            });

            // Close menu when clicking on a link
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    this.resetHamburger(navToggle);
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    this.resetHamburger(navToggle);
                }
            });
        }

        // Active link highlighting
        this.setupActiveLinks();
    }

    toggleHamburger(toggle) {
        const hamburgers = toggle.querySelectorAll('.hamburger');
        hamburgers[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        hamburgers[1].style.opacity = '0';
        hamburgers[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    }

    resetHamburger(toggle) {
        const hamburgers = toggle.querySelectorAll('.hamburger');
        hamburgers[0].style.transform = 'none';
        hamburgers[1].style.opacity = '1';
        hamburgers[2].style.transform = 'none';
    }

    setupActiveLinks() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-80px 0px -80px 0px'
        });

        sections.forEach(section => observer.observe(section));
    }

    // Theme toggle functionality
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            });
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    // Smooth scrolling for anchor links
    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Setup 25-hour clock
    setupClock() {
        // Initialize the embedded clocks
        this.initEmbeddedClocks();
    }

    initEmbeddedClocks() {
        // Initialize hero section clock
        const heroCustomTime = document.querySelector('.hero-clock-container .custom-time');
        const heroRealTime = document.querySelector('.hero-clock-container .real-time');
        
        if (heroCustomTime && heroRealTime && typeof CustomHoursClock !== 'undefined') {
            this.heroClock = new CustomHoursClock({
                timeElement: heroCustomTime,
                realTimeElement: heroRealTime
            });
            this.heroClock.start();
        }

        // Initialize work preview clock
        const previewCustomTime = document.querySelector('.work-preview .preview-custom-time');
        const previewRealTime = document.querySelector('.work-preview .preview-real-time');
        
        if (previewCustomTime && previewRealTime && typeof CustomHoursClock !== 'undefined') {
            this.previewClock = new CustomHoursClock({
                timeElement: previewCustomTime,
                realTimeElement: previewRealTime
            });
            this.previewClock.start();
        }
    }


    // Setup scroll animations
    setupAnimations() {
        // Fade in animation for elements
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
        const animatedElements = document.querySelectorAll('.work-card, .article-card, .hero-content, .hero-visual');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

        // Parallax effect for hero section
        this.setupParallax();
    }

    setupParallax() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (scrolled < hero.offsetHeight) {
                hero.style.transform = `translateY(${rate}px)`;
            }
        });
    }
}

// Initialize the portfolio site when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PortfolioSite();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh clocks when page becomes visible
        const event = new Event('focus');
        window.dispatchEvent(event);
    }
});

