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

    function initHub() {
        var mount = document.getElementById('studyProgressMount');
        if (!mount) return;

        var checkboxes = [];
        var label;
        var bar;

        function updateSummary() {
            if (!label || !bar) return;
            var n = checkboxes.filter(function (cb) {
                return cb.checked;
            }).length;
            var total = checkboxes.length;
            label.textContent = 'Solved: ' + n + ' / ' + total;
            bar.style.width = total ? Math.round((n / total) * 100) + '%' : '0%';
        }

        var lists = document.querySelectorAll('.courses-list:not(.courses-list-no-progress)');

        lists.forEach(function (ul) {
            var rows = [];
            ul.querySelectorAll(':scope > .course-item').forEach(function (li) {
                var a = li.querySelector(':scope > a[href$=".html"]');
                if (!a) return;
                var href = (a.getAttribute('href') || '').trim();
                if (!href || href.indexOf('http') === 0 || href.indexOf('//') === 0) return;
                if (href.indexOf('hld/') !== 0 && href.indexOf('lld/') !== 0) return;
                rows.push({ li: li, a: a, id: href });
            });

            rows.forEach(function (it, idx) {
                var li = it.li;
                if (li.querySelector(':scope > .done-cell input')) return;

                var slno = idx + 1;
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

                var num = document.createElement('span');
                num.className = 'topic-slno';
                num.textContent = String(slno);

                li.classList.add('topic-progress-enhanced');
                li.insertBefore(td, li.firstChild);
                li.insertBefore(num, it.a);
                checkboxes.push(inp);
            });
        });

        if (!checkboxes.length) return;

        var summary = document.createElement('div');
        summary.className = 'study-progress-summary';
        label = document.createElement('p');
        label.className = 'study-progress-label';
        var barWrap = document.createElement('div');
        barWrap.className = 'study-progress-bar-wrap';
        bar = document.createElement('div');
        bar.className = 'study-progress-bar-fill';
        barWrap.appendChild(bar);
        summary.appendChild(label);
        summary.appendChild(barWrap);
        mount.appendChild(summary);

        updateSummary();
    }

    function run() {
        if (document.getElementById('studyProgressMount')) {
            initHub();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
