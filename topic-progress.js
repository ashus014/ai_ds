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

    function makeToggleButton(isChecked) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'topic-progress-toggle';
        btn.setAttribute('aria-checked', isChecked ? 'true' : 'false');
        btn.setAttribute('aria-label', isChecked ? 'Marked done; click to undo' : 'Mark topic as done');
        btn.setAttribute('title', isChecked ? 'Done — click to undo' : 'Mark as done');
        return btn;
    }

    function syncToggleVisual(btn, done) {
        btn.setAttribute('aria-checked', done ? 'true' : 'false');
        btn.setAttribute('aria-label', done ? 'Marked done; click to undo' : 'Mark topic as done');
        btn.setAttribute('title', done ? 'Done — click to undo' : 'Mark as done');
    }

    function initHub() {
        var mount = document.getElementById('topic-progress-hub');
        if (!mount) return;

        var items = [];
        document.querySelectorAll('.courses-list .course-item').forEach(function (li) {
            var a = li.querySelector(':scope > a[href$=".html"]');
            if (!a) return;
            var href = (a.getAttribute('href') || '').trim();
            if (!href || href.indexOf('http') === 0 || href.indexOf('//') === 0) return;
            if (href.indexOf('hld/') !== 0 && href.indexOf('lld/') !== 0) return;
            items.push({ li: li, a: a, id: href });
        });

        if (!items.length) return;

        mount.removeAttribute('hidden');
        mount.innerHTML =
            '<span class="topic-progress-hub__label" id="topic-progress-hub-label"></span>' +
            '<div class="topic-progress-hub__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-labelledby="topic-progress-hub-label">' +
            '<div class="topic-progress-hub__fill" id="topic-progress-hub-fill"></div></div>';

        var labelEl = document.getElementById('topic-progress-hub-label');
        var fillEl = document.getElementById('topic-progress-hub-fill');
        var barEl = mount.querySelector('.topic-progress-hub__bar');

        function updateSummary() {
            var store = readStore();
            var done = 0;
            items.forEach(function (it) {
                if (isDone(it.id, store)) done++;
            });
            var total = items.length;
            var pct = total ? Math.round((done / total) * 100) : 0;
            if (labelEl) labelEl.textContent = 'Progress: ' + done + ' / ' + total + ' topics';
            if (fillEl) fillEl.style.width = pct + '%';
            if (barEl) {
                barEl.setAttribute('aria-valuenow', String(pct));
                barEl.setAttribute('aria-valuetext', done + ' of ' + total + ' complete');
            }
        }

        items.forEach(function (it) {
            var li = it.li;
            if (li.querySelector(':scope > .topic-progress-toggle')) return;
            var store = readStore();
            var done = isDone(it.id, store);
            if (done) li.classList.add('topic-progress-done');

            var btn = makeToggleButton(done);
            li.classList.add('topic-progress-enhanced');
            li.insertBefore(btn, li.firstChild);

            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var now = readStore();
                var next = !isDone(it.id, now);
                setDone(it.id, next);
                li.classList.toggle('topic-progress-done', next);
                syncToggleVisual(btn, next);
                updateSummary();
            });
        });

        updateSummary();
    }

    function initTopicPage() {
        var topicId = getCurrentTopicId();
        if (!topicId) return;

        var nav = document.querySelector('.navbar');
        if (!nav || nav.querySelector('.topic-progress-page-wrap')) return;

        var store = readStore();
        var done = isDone(topicId, store);

        var wrap = document.createElement('div');
        wrap.className = 'topic-progress-page-wrap';

        var lbl = document.createElement('span');
        lbl.className = 'topic-progress-page-label';
        lbl.textContent = 'Done';

        var btn = makeToggleButton(done);
        btn.setAttribute('aria-label', done ? 'Topic marked done; click to undo' : 'Mark this topic as done');

        wrap.appendChild(lbl);
        wrap.appendChild(btn);
        nav.appendChild(wrap);

        btn.addEventListener('click', function () {
            var now = readStore();
            var next = !isDone(topicId, now);
            setDone(topicId, next);
            syncToggleVisual(btn, next);
            btn.setAttribute('aria-label', next ? 'Topic marked done; click to undo' : 'Mark this topic as done');
            btn.setAttribute('title', next ? 'Done — click to undo' : 'Mark as done');
        });
    }

    function run() {
        if (document.getElementById('topic-progress-hub')) {
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
