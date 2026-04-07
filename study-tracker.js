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

    updateSummary();
  });
})();
