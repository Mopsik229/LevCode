        const words = ["продают", "работают 24/7", "приводят клиентов", "увеличивают прибыль"];
        let i = 0;
        const el = document.getElementById('rotateWord');
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function nextWord() {
            i = (i + 1) % words.length;
            el.style.opacity = 0;
            el.style.top = '6px';
            setTimeout(() => {
                el.textContent = words[i];
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

        // Stages progress bar logic
        const stageCards = document.querySelectorAll('.stage-card');
        const progressFill = document.getElementById('stagesProgressFill');
        const nodes = document.querySelectorAll('.progress-node');

        if (progressFill && stageCards.length > 0) {
            stageCards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    const index = parseInt(card.getAttribute('data-index'));
                    if (isNaN(index)) return;

                    // Set progress bar width
                    const percentage = (index / (stageCards.length - 1)) * 100;
                    progressFill.style.width = `${percentage}%`;

                    // Update active nodes
                    nodes.forEach((node, i) => {
                        if (i <= index) {
                            node.classList.add('active');
                        } else {
                            node.classList.remove('active');
                        }
                    });
                });
            });
        }

        // Stages accordion logic
        if (stageCards.length > 0) {
            // Open first card by default on load
            stageCards[0].classList.add('expanded');

            stageCards.forEach(card => {
                card.addEventListener('click', () => {
                    const isExpanded = card.classList.contains('expanded');
                    
                    // Close all cards
                    stageCards.forEach(c => c.classList.remove('expanded'));
                    
                    // Open the clicked one if it wasn't already open
                    if (!isExpanded) {
                        card.classList.add('expanded');
                    }
                });
            });
        }

        // Modal Logic
        const modalBtns = document.querySelectorAll('.js-open-modal');
        const modal = document.getElementById('projectModal');
        const modalClose = document.querySelector('.modal-close');
        
        if (modal) {
            modalBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.classList.add('is-open');
                    document.body.style.overflow = 'hidden'; // Prevent scrolling
                });
            });

            const closeModal = () => {
                modal.classList.remove('is-open');
                document.body.style.overflow = '';
            };

            modalClose.addEventListener('click', closeModal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
            
            // Handle form submit to send data to Supabase
            const form = document.getElementById('projectForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const submitBtn = form.querySelector('.btn-submit');
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = 'Отправка...';
                    submitBtn.style.pointerEvents = 'none';

                    const name = document.getElementById('f-name').value;
                    const contact = document.getElementById('f-contact').value;
                    const type = document.getElementById('f-type').value;
                    const budget = document.getElementById('f-budget').value;
                    const description = document.getElementById('f-desc').value;
                    
                    if (window.supabaseClient) {
                        const { error } = await window.supabaseClient.from('leads').insert([{
                            name: name,
                            contact: contact,
                            type: type,
                            budget: budget,
                            description: description,
                            stage: 'new',
                            notes: []
                        }]);

                        if (error) {
                            console.error('Ошибка отправки:', error);
                            submitBtn.textContent = 'Ошибка';
                            submitBtn.style.background = '#ff5e5e';
                        } else {
                            submitBtn.textContent = 'Отправлено!';
                            submitBtn.style.background = 'var(--accent-dim)';
                        }
                    } else {
                        submitBtn.textContent = 'Отправлено!';
                        submitBtn.style.background = 'var(--accent-dim)';
                    }
                    
                    setTimeout(() => {
                        closeModal();
                        setTimeout(() => {
                            form.reset();
                            submitBtn.textContent = originalText;
                            submitBtn.style.background = '';
                            submitBtn.style.pointerEvents = 'auto';
                        }, 300);
                    }, 1500);
                });
            }
        }

