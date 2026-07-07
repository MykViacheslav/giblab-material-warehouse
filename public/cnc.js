let workers = [];
let queue = [];
let activeJobId = null;

const els = {
  workerSelect: document.getElementById('workerSelect'),
  addWorkerBtn: document.getElementById('addWorkerBtn'),
  newWorkerName: document.getElementById('newWorkerName'),
  jobQueue: document.getElementById('jobQueue'),
  jobTitle: document.getElementById('jobTitle'),
  jobActions: document.getElementById('jobActions'),
  jobMaterials: document.getElementById('jobMaterials'),
  sheetsList: document.getElementById('sheetsList'),
  offcutsList: document.getElementById('offcutsList'),
  btnStart: document.getElementById('btnStart'),
  btnComplete: document.getElementById('btnComplete'),
  btnError: document.getElementById('btnError'),
  clock: document.getElementById('clock'),
  errorModal: document.getElementById('errorModal'),
  btnCancelError: document.getElementById('btnCancelError'),
  btnSubmitError: document.getElementById('btnSubmitError'),
  errorType: document.getElementById('errorType'),
  errorDesc: document.getElementById('errorDesc')
};

// Clock
setInterval(() => {
  els.clock.textContent = new Date().toLocaleTimeString('pl-PL');
}, 1000);

async function fetchJson(url) {
  const r = await fetch(url);
  return r.json();
}
async function postJson(url, data) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

async function loadWorkers() {
  workers = await fetchJson('/api/workers');
  els.workerSelect.innerHTML = '<option value="">Wybierz operatora...</option>' + 
    workers.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
  const savedWorker = localStorage.getItem('cncWorker');
  if (savedWorker) els.workerSelect.value = savedWorker;
}

els.workerSelect.addEventListener('change', (e) => {
  localStorage.setItem('cncWorker', e.target.value);
});

els.addWorkerBtn.addEventListener('click', async () => {
  if (els.newWorkerName.style.display === 'none') {
    els.newWorkerName.style.display = 'block';
    els.newWorkerName.focus();
  } else {
    const name = els.newWorkerName.value.trim();
    if (name) {
      await postJson('/api/workers', { name });
      await loadWorkers();
      els.workerSelect.value = name;
      localStorage.setItem('cncWorker', name);
    }
    els.newWorkerName.style.display = 'none';
    els.newWorkerName.value = '';
  }
});

async function loadQueue() {
  queue = await fetchJson('/api/cnc/queue');
  renderQueue();
}

function renderQueue() {
  els.jobQueue.innerHTML = queue.map(job => `
    <div class="cnc-job-card ${job.id === activeJobId ? 'active' : ''}" onclick="selectJob(${job.id})">
      <h3>${job.name}</h3>
      <p>Status: ${job.cnc_status} | Płyta: ${job.material_name || 'Brak'}</p>
    </div>
  `).join('');
}

async function selectJob(id) {
  activeJobId = id;
  renderQueue();
  const job = queue.find(j => j.id === id);
  if (!job) return;

  els.jobTitle.textContent = `Rozkrój: ${job.name}`;
  els.jobActions.style.display = 'flex';
  els.jobMaterials.style.display = 'block';

  if (job.cnc_status === 'W trakcie') {
    els.btnStart.style.display = 'none';
    els.btnComplete.style.display = 'block';
  } else {
    els.btnStart.style.display = 'block';
    els.btnComplete.style.display = 'none';
  }

  els.sheetsList.innerHTML = `<div class="material-item">
    <div>
      <strong>Płyta:</strong> ${job.material_name || job.material_code} <br/>
      <strong>Ilość arkuszy:</strong> ${job.board_sheets_actual || 'Z projektu'}
    </div>
    <div class="location">Z MAGAZYNU PŁYT</div>
  </div>`;

  const { offcuts } = await fetchJson(`/api/cnc/materials/${job.id}`);
  
  if (offcuts.length === 0) {
    els.offcutsList.innerHTML = '<p>Brak zarezerwowanych resztek dla tego rozkroju.</p>';
  } else {
    els.offcutsList.innerHTML = offcuts.map(o => `
      <div class="material-item">
        <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; flex: 1;">
          <input type="checkbox" class="planned-offcut-checkbox" value="${o.id}" checked style="width: 24px; height: 24px;">
          <div>
            <strong>Wymiar:</strong> ${o.length} x ${o.width} mm<br/>
            <strong>Kod / Uwagi:</strong> ${o.id}
          </div>
        </label>
        <div class="location">${o.storage_location || 'BRAK LOKALIZACJI'}</div>
      </div>
    `).join('');
  }
}

els.btnStart.addEventListener('click', async () => {
  const workerName = els.workerSelect.value;
  if (!workerName) return alert("Wybierz operatora przed rozpoczęciem!");
  await postJson(`/api/cnc/job/${activeJobId}/start`, { workerName });
  await loadQueue();
  selectJob(activeJobId);
});

els.btnComplete.addEventListener('click', async () => {
    if (!confirm("Czy na pewno chcesz zakończyć ten rozkrój?")) return;
    const workerName = els.workerSelect.value;
    if (!workerName) return alert("Wybierz operatora u góry ekranu przed zakończeniem!");
    
    const checkboxes = document.querySelectorAll('.planned-offcut-checkbox:checked');
    const plannedUsed = Array.from(checkboxes).map(cb => cb.value);
    const extraUsed = extraUsedOffcuts.map(o => o.id);
    const allUsedOffcuts = [...plannedUsed, ...extraUsed];

    await postJson(`/api/cnc/job/${activeJobId}/complete`, { usedOffcutIds: allUsedOffcuts, workerName });
    activeJobId = null;
    extraUsedOffcuts = [];
    if (typeof renderExtraOffcuts === 'function') renderExtraOffcuts();
    
    els.jobTitle.textContent = "Wybierz rozkrój z kolejki";
    els.jobActions.style.display = 'none';
    els.jobMaterials.style.display = 'none';
    await loadQueue();
  });

els.btnError.addEventListener('click', () => els.errorModal.style.display = 'flex');
els.btnCancelError.addEventListener('click', () => els.errorModal.style.display = 'none');

els.btnSubmitError.addEventListener('click', async () => {
  const workerName = els.workerSelect.value;
  if (!workerName) return alert("Wybierz operatora!");
  await postJson('/api/cnc/report', {
    cutJobId: activeJobId,
    workerName,
    errorType: els.errorType.value,
    description: els.errorDesc.value
  });
  els.errorModal.style.display = 'none';
  els.errorDesc.value = '';
  alert("Zgłoszenie wysłane.");
});

// Init
loadWorkers();
loadQueue();
setInterval(loadQueue, 10000); // refresh queue every 10s


let extraUsedOffcuts = [];
const elsExtra = {
  extraOffcutId: document.getElementById('extraOffcutId'),
  btnAddExtraOffcut: document.getElementById('btnAddExtraOffcut'),
  extraOffcutsList: document.getElementById('extraOffcutsList')
};

function renderExtraOffcuts() {
  if (!elsExtra.extraOffcutsList) return;
  elsExtra.extraOffcutsList.innerHTML = extraUsedOffcuts.map(o => "
    <li style='margin-bottom:0.5rem;'>
      <strong>${escapeHtml(o.id)}</strong> - Wymiar: ${o.length} x ${o.width} mm
      <button class='outline-action danger-outline' style='padding:0.2rem 0.5rem; margin-left:1rem; font-size:0.8rem;' onclick='removeExtraOffcut("${escapeHtml(o.id)}")'>Usuń</button>
    </li>
  ").join('');
}

window.removeExtraOffcut = function(id) {
  extraUsedOffcuts = extraUsedOffcuts.filter(o => o.id !== id);
  renderExtraOffcuts();
};

if (elsExtra.btnAddExtraOffcut) {
  elsExtra.btnAddExtraOffcut.addEventListener('click', async () => {
    const id = elsExtra.extraOffcutId.value.trim();
    if (!id) return;
    if (extraUsedOffcuts.find(o => o.id === id)) {
      alert("Ta resztka już jest na liście!");
      return;
    }
    
    try {
      const response = await fetch('/api/cnc/offcuts/' + encodeURIComponent(id));
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Błąd pobierania resztki");
        return;
      }
      const offcut = await response.json();
      extraUsedOffcuts.push(offcut);
      renderExtraOffcuts();
      elsExtra.extraOffcutId.value = '';
    } catch (e) {
      alert("Błąd połączenia z serwerem");
    }
  });
}
