(function () {
    'use strict';

    var STORAGE_KEY = 'ai_ds_topic_progress_v1';

    function readStore() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {};
            var o = JSON.parse(raw);
            return o && typeof o === 'object' ? o : {};
        } catch (e) {
            return {};
        }
    }

    function writeStore(obj) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        } catch (e) {}
    }

    function isDone(id, store) {
        store = store || readStore();
        return !!store[id];
    }

    function setDone(id, done) {
        var store = readStore();
        if (done) store[id] = 1;
        else delete store[id];
        writeStore(store);
        return store;
    }

    function getCurrentTopicId() {
        var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname.replace(/\\/g, '/') : '';
        var m = path.match(/((?:hld|lld)\/[^/]+\.html)$/i);
        return m ? m[1].replace(/\\/g, '/') : null;
    }

    /** No hub tick / no topic-page “Done” for guide or concept-only pages (same idea as LLD guide). */
    function isExcludedFromTopicProgress(topicId) {
        if (!topicId) return true;
        if (topicId === 'lld/how-to-answer-lld-questions.html') return true;
        if (topicId === 'hld/proximity-search.html') return true;
        if (topicId === 'hld/real-time-applications.html') return true;
        return false;
    }

    function initHub() {
        var mount = document.getElementById('studyProgressMount');
        if (!mount) return;

        var items = [];
        document.querySelectorAll('.courses-list .course-item').forEach(function (li) {
            var ul = li.closest('ul');
            if (ul && ul.classList.contains('courses-list-no-progress')) return;
            var a = li.querySelector(':scope > a[href$=".html"]');
            if (!a) return;
            var href = (a.getAttribute('href') || '').trim();
            if (!href || href.indexOf('http') === 0 || href.indexOf('//') === 0) return;
            if (href.indexOf('hld/') !== 0 && href.indexOf('lld/') !== 0) return;
            items.push({ li: li, a: a, id: href });
        });

        if (!items.length) return;

        var summary = document.createElement('div');
        summary.className = 'study-progress-summary';
        var label = document.createElement('p');
        label.className = 'study-progress-label';
        var barWrap = document.createElement('div');
        barWrap.className = 'study-progress-bar-wrap';
        var bar = document.createElement('div');
        bar.className = 'study-progress-bar-fill';
        barWrap.appendChild(bar);
        summary.appendChild(label);
        summary.appendChild(barWrap);
        mount.appendChild(summary);

        var checkboxes = [];

        function updateSummary() {
            var n = checkboxes.filter(function (cb) {
                return cb.checked;
            }).length;
            var total = checkboxes.length;
            label.textContent = 'Solved: ' + n + ' / ' + total;
            bar.style.width = total ? Math.round((n / total) * 100) + '%' : '0%';
        }

        items.forEach(function (it) {
            var li = it.li;
            if (li.querySelector(':scope > .done-cell input')) return;

            var td = document.createElement('span');
            td.className = 'done-cell';
            var inp = document.createElement('input');
            inp.type = 'checkbox';
            inp.setAttribute('aria-label', 'Mark as done');
            if (isDone(it.id)) {
                inp.checked = true;
                li.classList.add('row-solved');
            }
            inp.addEventListener('change', function () {
                if (inp.checked) {
                    setDone(it.id, true);
                    li.classList.add('row-solved');
                } else {
                    setDone(it.id, false);
                    li.classList.remove('row-solved');
                }
                updateSummary();
            });
            td.appendChild(inp);
            li.classList.add('topic-progress-enhanced');
            li.insertBefore(td, li.firstChild);
            checkboxes.push(inp);
        });

        updateSummary();
    }

    function initTopicPage() {
        var topicId = getCurrentTopicId();
        if (!topicId || isExcludedFromTopicProgress(topicId)) return;

        var nav = document.querySelector('.navbar');
        if (!nav || nav.querySelector('.topic-progress-page-wrap')) return;

        var wrap = document.createElement('div');
        wrap.className = 'topic-progress-page-wrap';

        var cell = document.createElement('span');
        cell.className = 'done-cell';

        var inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.id = 'topicProgressPageDone';
        inp.setAttribute('aria-label', 'Mark this topic as done');
        if (isDone(topicId)) inp.checked = true;

        var lbl = document.createElement('label');
        lbl.className = 'topic-progress-page-label';
        lbl.setAttribute('for', 'topicProgressPageDone');
        lbl.textContent = 'Done';

        inp.addEventListener('change', function () {
            setDone(topicId, inp.checked);
        });

        cell.appendChild(inp);
        wrap.appendChild(cell);
        wrap.appendChild(lbl);
        nav.appendChild(wrap);
    }

    function run() {
        if (document.getElementById('studyProgressMount')) {
            initHub();
        }
        initTopicPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
