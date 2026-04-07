(function () {
  var trackId = document.body.getAttribute('data-study-track');
  if (!trackId) return;

  var STORAGE_KEY = 'ai_ds_study_done_' + trackId;

  function loadSolvedIndices() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.map(Number).filter(function (n) { return !isNaN(n); }));
    } catch (e) {
      return new Set();
    }
  }

  function saveSolvedIndices(set) {
    var list = Array.from(set).sort(function (a, b) { return a - b; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  if (!document.getElementById('study-tracker-styles')) {
    var st = document.createElement('style');
    st.id = 'study-tracker-styles';
    st.textContent =
      '.study-clear-wrap{text-align:center;margin-top:12px;}' +
      '.study-clear-done-btn{font:inherit;font-size:0.9em;font-weight:600;color:#5c6bc0;background:#fff;border:1px solid #c5cae9;border-radius:8px;padding:6px 16px;cursor:pointer;}' +
      '.study-clear-done-btn:hover{background:#e8eaf6;color:#3949ab;border-color:#9fa8da;}' +
      '.study-clear-done-btn:focus-visible{outline:2px solid #667eea;outline-offset:2px;}';
    document.head.appendChild(st);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('studyProgressMount');
    var table = document.querySelector('.main-container .table-wrap table');
    if (!table || !mount) return;

    var theadRow = table.querySelector('thead tr');
    var th = document.createElement('th');
    th.scope = 'col';
    th.className = 'col-done';
    th.textContent = 'Done';
    theadRow.insertBefore(th, theadRow.firstChild);

    var cg = table.querySelector('colgroup');
    if (cg) {
      var col = document.createElement('col');
      col.className = 'col-done';
      col.span = 1;
      cg.insertBefore(col, cg.firstChild);
    }

    var solved = loadSolvedIndices();
    var tbody = table.querySelector('tbody');
    var checkboxes = [];

    Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr) {
      if (tr.classList.contains('cat-row')) {
        var cell = tr.querySelector('td');
        if (cell) cell.setAttribute('colspan', '7');
        return;
      }
      var idx = checkboxes.length;
      var td = document.createElement('td');
      td.className = 'done-cell';
      var inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.setAttribute('aria-label', 'Mark as solved');
      if (solved.has(idx)) {
        inp.checked = true;
        tr.classList.add('row-solved');
      }
      inp.addEventListener('change', function () {
        if (inp.checked) {
          solved.add(idx);
          tr.classList.add('row-solved');
        } else {
          solved.delete(idx);
          tr.classList.remove('row-solved');
        }
        saveSolvedIndices(solved);
        updateSummary();
      });
      td.appendChild(inp);
      tr.insertBefore(td, tr.firstChild);
      checkboxes.push(inp);
    });

    var total = checkboxes.length;
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

    function updateSummary() {
      var n = checkboxes.filter(function (cb) { return cb.checked; }).length;
      label.textContent = 'Solved: ' + n + ' / ' + total;
      var pct = total ? Math.round((n / total) * 100) : 0;
      bar.style.width = pct + '%';
    }

    var clearWrap = document.createElement('div');
    clearWrap.className = 'study-clear-wrap';
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'study-clear-done-btn';
    clearBtn.textContent = 'Clear all done ticks';
    clearBtn.setAttribute(
      'aria-label',
      'Deselect all done checkboxes for this problem list'
    );
    clearBtn.addEventListener('click', function () {
      if (
        !window.confirm(
          'Clear every done tick for this list? Your progress is only stored in this browser.'
        )
      ) {
        return;
      }
      solved.clear();
      saveSolvedIndices(solved);
      checkboxes.forEach(function (cb) {
        cb.checked = false;
      });
      Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (tr) {
        if (!tr.classList.contains('cat-row')) {
          tr.classList.remove('row-solved');
        }
      });
      updateSummary();
    });
    clearWrap.appendChild(clearBtn);
    mount.appendChild(clearWrap);

    updateSummary();
  });
})();
