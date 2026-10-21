(function () {
    'use strict';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const words = ["продают", "работают 24/7", "приводят клиентов", "увеличивают прибыль"];
    let wordIndex = 0;
    const el = document.getElementById('rotateWord');

    if (el) {
        function nextWord() {
            wordIndex = (wordIndex + 1) % words.length;
            el.style.opacity = 0;
            el.style.top = '6px';
            setTimeout(() => {
                el.textContent = words[wordIndex];
                el.style.top = '-6px';
                requestAnimationFrame(() => {
                    el.style.opacity = 1;
                    el.style.top = '0';
                });
            }, 220);
        }

        el.style.transition = 'opacity .22s ease, top .22s ease';

        if (!reduce) {
            setInterval(nextWord, 2200);
        }
    }

    let lenis = null;
    if (!reduce && typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.9,
            touchMultiplier: 1.5
        });

        function lenisRaf(time) {
            lenis.raf(time);
            requestAnimationFrame(lenisRaf);
        }
        requestAnimationFrame(lenisRaf);

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (!href || href === '#' || href === '#modal' || href === '#projectModal') return;
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    lenis.scrollTo(target, {
                        offset: -70,
                        duration: 1.2
                    });
                }
            });
        });
    }

    (function initScrollReveal() {
        if (reduce) return;

        document.documentElement.classList.add('reveal-ready');

        const headings = document.querySelectorAll(
            '.section-head, .hero h1, .hero-sub, .hero-actions, .cta-box h2, .cta-tag'
        );
        headings.forEach(item => item.classList.add('reveal-head'));

        const cards = document.querySelectorAll(
            '.work-card, .service-row, .cycle-item, .stage-card, .cta-box, .stages-progress-container, .faq-item'
        );
        cards.forEach(item => item.classList.add('reveal-card'));

        const revealElements = document.querySelectorAll('.reveal-head, .reveal-card');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    })();

    const stageCards = document.querySelectorAll('.stage-card');
    const progressFill = document.getElementById('stagesProgressFill');
    const nodes = document.querySelectorAll('.progress-node');

    function updateStageProgress(index) {
        if (isNaN(index) || index < 0 || index >= stageCards.length) return;

        if (progressFill && stageCards.length > 1) {
            const percentage = (index / (stageCards.length - 1)) * 100;
            progressFill.style.width = `${percentage}%`;
        }

        nodes.forEach((node, i) => {
            if (i <= index) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });
    }

    if (stageCards.length > 0) {
        stageCards[0].classList.add('expanded');
        updateStageProgress(0);

        stageCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                const cardIndex = parseInt(card.getAttribute('data-index'));
                updateStageProgress(!isNaN(cardIndex) ? cardIndex : index);
            });

            card.addEventListener('click', () => {
                const cardIndex = parseInt(card.getAttribute('data-index'));
                const activeIdx = !isNaN(cardIndex) ? cardIndex : index;
                updateStageProgress(activeIdx);

                const isExpanded = card.classList.contains('expanded');
                stageCards.forEach(c => c.classList.remove('expanded'));
                if (!isExpanded) {
                    card.classList.add('expanded');
                }
            });
        });

        nodes.forEach((node, nodeIdx) => {
            node.addEventListener('click', () => {
                updateStageProgress(nodeIdx);
                stageCards.forEach((c, cIdx) => {
                    if (cIdx === nodeIdx) {
                        c.classList.add('expanded');
                    } else {
                        c.classList.remove('expanded');
                    }
                });
            });
        });
    }

    const modal = document.getElementById('projectModal');
    const modalClose = document.querySelector('.modal-close');

    let openModal = () => {};
    let closeModal = () => {};

    if (modal) {
        openModal = () => {
            modal.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            if (lenis) lenis.stop();
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 120);
            }
        };

        closeModal = () => {
            modal.classList.remove('is-open');
            document.body.style.overflow = '';
            if (lenis) lenis.start();
            if (window.location.hash === '#modal' || window.location.hash === '#projectModal') {
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        };

        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.js-open-modal, a[href="#modal"], a[href="#projectModal"]');
            if (trigger) {
                e.preventDefault();
                const type = trigger.getAttribute('data-type');
                if (type) {
                    const select = modal.querySelector('#f-type');
                    if (select) select.value = type;
                }
                openModal();
            }
        });

        if (modalClose) {
            modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                closeModal();
            }
        });

        const checkHashModal = () => {
            if (window.location.hash === '#modal' || window.location.hash === '#projectModal') {
                openModal();
            }
        };
        checkHashModal();
        window.addEventListener('hashchange', checkHashModal);

        window.openProjectModal = openModal;
        window.closeProjectModal = closeModal;
    }

    const form = document.getElementById('projectForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.style.pointerEvents = 'none';

            const payload = {
                name: document.getElementById('f-name')?.value?.trim() || '',
                contact: document.getElementById('f-contact')?.value?.trim() || '',
                type: document.getElementById('f-type')?.value || '',
                budget: document.getElementById('f-budget')?.value || '',
                description: document.getElementById('f-desc')?.value?.trim() || ''
            };

            let isSuccess = false;

            try {
                const response = await fetch('/api/send-lead.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json().catch(() => ({}));
                if (response.ok && result.success) {
                    isSuccess = true;
                }
            } catch (err) {
                isSuccess = false;
            }

            if (isSuccess) {
                if (typeof ym === 'function') {
                    ym(111801512, 'reachGoal', 'lead_form_success');
                }
                submitBtn.textContent = 'Отправлено!';
                submitBtn.style.background = 'var(--accent-dim)';
            } else {
                submitBtn.textContent = 'Ошибка';
                submitBtn.style.background = '#ff5e5e';
            }

            setTimeout(() => {
                closeModal();
                setTimeout(() => {
                    form.reset();
                    if (submitBtn) {
                        submitBtn.textContent = originalText;
                        submitBtn.style.background = '';
                        submitBtn.style.pointerEvents = 'auto';
                    }
                }, 300);
            }, 1500);
        });
    }

    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach((item) => {
            const btn = item.querySelector('.faq-q');
            if (!btn) return;
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');

                faqItems.forEach((other) => {
                    other.classList.remove('open');
                    const otherBtn = other.querySelector('.faq-q');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                });

                if (!isOpen) {
                    item.classList.add('open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    (function initCookieBanner() {
        const CONSENT_KEY = 'levcode_cookie_consent';
        try {
            if (localStorage.getItem(CONSENT_KEY)) return;
        } catch (e) {
        }

        const isSubfolder = window.location.pathname.includes('/landing/') ||
            window.location.pathname.includes('/multipage/') ||
            window.location.pathname.includes('/vizitka/') ||
            window.location.pathname.includes('/redesign/') ||
            window.location.pathname.includes('/verstka/');
        const cookieUrl = isSubfolder ? '../cookie-policy.html' : 'cookie-policy.html';

        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Уведомление об использовании файлов cookie');
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"></circle>
                        <circle cx="7" cy="15" r="1.5" fill="currentColor"></circle>
                        <circle cx="12" cy="18" r="1.5" fill="currentColor"></circle>
                        <circle cx="16" cy="13" r="1.5" fill="currentColor"></circle>
                    </svg>
                </div>
                <div class="cookie-text">
                    Мы используем файлы cookie и аналитику для корректной работы сайта и улучшения пользовательского опыта. Подробнее — в нашей <a href="${cookieUrl}">Политике файлов cookie</a>.
                </div>
            </div>
            <div class="cookie-actions">
                <button type="button" class="cookie-btn-accept">Принять</button>
            </div>
        `;

        document.body.appendChild(banner);

        setTimeout(() => {
            banner.classList.add('is-visible');
        }, 600);

        const acceptBtn = banner.querySelector('.cookie-btn-accept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                try {
                    localStorage.setItem(CONSENT_KEY, 'accepted');
                } catch (e) {}
                banner.classList.remove('is-visible');
                setTimeout(() => {
                    banner.remove();
                }, 450);
            });
        }
    })();

})();
