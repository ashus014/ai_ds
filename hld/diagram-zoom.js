(function () {
    'use strict';

    var SCALE_MIN = 0.25;
    var SCALE_MAX = 6;
    var ZOOM_FACTOR = 1.2;

    function buildModal() {
        var root = document.createElement('div');
        root.className = 'hld-diagram-modal';
        root.setAttribute('hidden', '');
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-modal', 'true');
        root.setAttribute('aria-label', 'Diagram zoom');

        var backdrop = document.createElement('div');
        backdrop.className = 'hld-diagram-modal__backdrop';

        var toolbar = document.createElement('div');
        toolbar.className = 'hld-diagram-modal__toolbar';

        function btn(label, action) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.addEventListener('click', function (e) {
                e.stopPropagation();
                action();
            });
            return b;
        }

        var viewport = document.createElement('div');
        viewport.className = 'hld-diagram-modal__viewport';

        var img = document.createElement('img');
        img.alt = '';

        var hint = document.createElement('p');
        hint.className = 'hld-diagram-modal__hint';
        hint.textContent = 'Scroll to pan · +/− to zoom · Esc to close';

        var naturalW = 0;
        var naturalH = 0;
        var scale = 1;
        var fitScale = 1;

        function applyScale() {
            if (!naturalW) return;
            var s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
            scale = s;
            img.style.width = Math.round(naturalW * s) + 'px';
            img.style.height = 'auto';
        }

        function zoomIn() {
            scale *= ZOOM_FACTOR;
            applyScale();
        }

        function zoomOut() {
            scale /= ZOOM_FACTOR;
            applyScale();
        }

        function resetZoom() {
            scale = fitScale;
            applyScale();
            viewport.scrollLeft = 0;
            viewport.scrollTop = 0;
        }

        function close() {
            root.setAttribute('hidden', '');
            document.body.classList.remove('hld-diagram-modal-open');
            document.removeEventListener('keydown', onKey);
        }

        function onKey(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                zoomIn();
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                zoomOut();
            }
        }

        function open(src, altText) {
            img.removeAttribute('style');
            img.alt = altText || 'Diagram';
            img.src = src;
            root.removeAttribute('hidden');
            document.body.classList.add('hld-diagram-modal-open');
            document.addEventListener('keydown', onKey);

            function computeFit() {
                naturalW = img.naturalWidth;
                naturalH = img.naturalHeight;
                if (!naturalW) return;
                var pad = 32;
                var maxW = Math.max(200, window.innerWidth * 0.96 - pad);
                var maxH = Math.max(200, window.innerHeight - 120 - pad);
                fitScale = Math.min(maxW / naturalW, maxH / naturalH, 1);
                scale = fitScale;
                applyScale();
                viewport.scrollLeft = 0;
                viewport.scrollTop = 0;
            }

            if (img.complete && img.naturalWidth) {
                computeFit();
            } else {
                img.onload = computeFit;
            }
        }

        backdrop.addEventListener('click', close);

        toolbar.appendChild(btn('Zoom in', zoomIn));
        toolbar.appendChild(btn('Zoom out', zoomOut));
        toolbar.appendChild(btn('Reset', resetZoom));
        toolbar.appendChild(btn('Close', close));

        viewport.appendChild(img);

        root.appendChild(backdrop);
        root.appendChild(toolbar);
        root.appendChild(viewport);
        root.appendChild(hint);

        document.body.appendChild(root);

        viewport.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        root.addEventListener('click', function (e) {
            if (e.target === root) close();
        });

        viewport.addEventListener(
            'wheel',
            function (e) {
                if (!e.ctrlKey && !e.metaKey) return;
                e.preventDefault();
                if (e.deltaY < 0) zoomIn();
                else zoomOut();
            },
            { passive: false }
        );

        window.addEventListener('resize', function () {
            if (root.hasAttribute('hidden')) return;
            if (naturalW) {
                var pad = 32;
                var maxW = Math.max(200, window.innerWidth * 0.96 - pad);
                var maxH = Math.max(200, window.innerHeight - 120 - pad);
                fitScale = Math.min(maxW / naturalW, maxH / naturalH, 1);
                if (scale <= fitScale * 1.01) {
                    scale = fitScale;
                    applyScale();
                }
            }
        });

        return { open: open, close: close };
    }

    var modal = buildModal();

    function attachFigure(fig) {
        var img = fig.querySelector('img');
        if (!img || img.dataset.diagramZoomBound === '1') return;
        img.dataset.diagramZoomBound = '1';

        var cap = fig.querySelector('figcaption');
        if (cap && !cap.querySelector('.diagram-zoom-hint')) {
            var span = document.createElement('span');
            span.className = 'diagram-zoom-hint';
            span.textContent = 'Click image to zoom · pinch or Ctrl+scroll in viewer';
            cap.appendChild(span);
        }

        function launch() {
            modal.open(img.currentSrc || img.src, img.alt);
        }

        img.addEventListener('click', function (e) {
            e.preventDefault();
            launch();
        });
        img.setAttribute('tabindex', '0');
        img.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                launch();
            }
        });
    }

    function init() {
        document.querySelectorAll('.diagram-figure').forEach(attachFigure);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
