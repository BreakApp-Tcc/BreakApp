
(function() {
    const alimentos = document.querySelectorAll('.alimento');

    const overlay = document.getElementById('overlay-alimento');
    const modal = overlay.querySelector('.modal');
    const closeBtn = document.getElementById('closeBtn-alimento');
    const cancelBtn = document.getElementById('cancelBtn-alimento');
    const modalContent = document.getElementById('modal-content-alimento');

    let lastFocusedElement = null;

    function getFocusableElements(container) {
        return Array.from(container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
    }

    function openModal(content) {
        lastFocusedElement = document.activeElement;
        modalContent.textContent = content;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.style.overflow = 'hidden';

        const focusable = getFocusableElements(modal);
        if (focusable.length) focusable[0].focus();
        else modal.focus();

        document.addEventListener('keydown', onKeyDown);
    }

    function closeModal() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
        if (lastFocusedElement) lastFocusedElement.focus();
        document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
        } else if (e.key === 'Tab') {
            const focusable = getFocusableElements(modal);
            if (focusable.length === 0) {
                e.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) { 
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    alimentos.forEach(alimento => {
        alimento.addEventListener('click', () => {
            openModal(alimento.textContent.trim());
        });
    });
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

})();

