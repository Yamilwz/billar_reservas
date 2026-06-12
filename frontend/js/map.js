let currentDate = new Date().toISOString().split('T')[0];
document.getElementById('date-picker').value = currentDate;

async function loadTables() {
  currentDate = document.getElementById('date-picker').value;
  const container = document.getElementById('tables-container');

  // Mostrar skeleton loading
  container.innerHTML = `
    ${[1,2,3,4,5,6].map(() => `
      <div class="col-md-4 col-sm-6">
        <div class="table-card" style="opacity:.4;pointer-events:none;">
          <div class="billiard-surface"><div class="table-number">…</div></div>
          <div class="table-info"><h5 style="background:var(--bg-600);height:20px;border-radius:4px;"></h5></div>
        </div>
      </div>`).join('')}`;

  try {
    // Obtener mesas y slots en paralelo; si alguno falla se usa array vacío
    const [tablesResult, slotsResult] = await Promise.allSettled([
      api.tables.getAll(),
      api.reservations.getSlots(currentDate)
    ]);

    const tables = tablesResult.status === 'fulfilled' ? tablesResult.value : [];
    const slots  = slotsResult.status  === 'fulfilled' ? slotsResult.value  : [];

    // Si no hay mesas y hubo error de auth, redirigir a login
    if (tables.length === 0 && tablesResult.status === 'rejected') {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert-dark-danger">
            Debes <a href="/login.html" style="color:var(--primary)">iniciar sesión</a> para ver las mesas.
          </div>
        </div>`;
      return;
    }

    // Si las mesas cargaron bien pero los slots fallaron, mostramos igual con aviso
    const slotsError = slotsResult.status === 'rejected';

    container.innerHTML = '';

    tables.forEach(table => {
      const tableSlots = slots.filter(s => s.table_id === table.id);
      const statusClass = table.status;
      const isAvailable  = table.status === 'disponible';

      let slotsHtml = '<span style="color:var(--primary);font-size:.8rem;">Libre todo el día</span>';
      if (slotsError) {
        slotsHtml = '<span style="color:var(--text-400);font-size:.8rem;">Sin datos de horarios</span>';
      } else if (tableSlots.length > 0) {
        slotsHtml = tableSlots.map(s =>
          `<span class="slot-item"> ${s.start_time.substring(0,5)} – ${s.end_time.substring(0,5)}</span>`
        ).join('');
      }

      const slotsJson = encodeURIComponent(JSON.stringify(tableSlots));

      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6 slide-up';
      col.innerHTML = `
        <div class="table-card ${statusClass}" onclick="${isAvailable ? `openReserveModal(${table.id}, ${table.table_number}, '${slotsJson}')` : ''}">
          <div class="billiard-surface">
            <span class="status-badge ${statusClass}">${table.status}</span>
            <div class="table-number">${table.table_number}</div>
          </div>
          <div class="table-info">
            <h5>Mesa ${table.table_number}</h5>
            <div class="d-flex justify-content-between align-items-center">
              <span class="price">Bs ${table.price_per_hour}/hora</span>
              <span style="font-size:.78rem; color:var(--text-400)">${tableSlots.length} reserva(s) hoy</span>
            </div>
            <div class="slots mt-2">${slotsHtml}</div>
            <button class="btn-primary-custom w-100 mt-2" style="font-size:.88rem; padding:8px"
              ${isAvailable ? `onclick="event.stopPropagation(); openReserveModal(${table.id}, ${table.table_number}, '${slotsJson}')"` : 'disabled'}>
              ${isAvailable ? 'Reservar' : table.status}
            </button>
          </div>
        </div>
      `;
      container.appendChild(col);
    });

  } catch (error) {
    container.innerHTML = `<div class="col-12"><div class="alert-dark-danger">${error.message}</div></div>`;
  }
}

const reserveModal = new bootstrap.Modal(document.getElementById('reserveModal'));

function openReserveModal(id, number, slotsJson) {
  if (!localStorage.getItem('token')) {
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('tableId').value = id;
  document.getElementById('modal-table-num').innerText = number;
  document.getElementById('reserveError').classList.add('d-none');

  const container = document.getElementById('reserved-slots-container');
  const list = document.getElementById('reserved-slots-list');

  if (slotsJson) {
    const slots = JSON.parse(decodeURIComponent(slotsJson));
    if (slots.length > 0) {
      container.classList.remove('d-none');
      list.innerHTML = slots.map(s =>
        `<span class="slot-item"> ${s.start_time.substring(0,5)} a ${s.end_time.substring(0,5)}</span>`
      ).join('');
    } else {
      container.classList.add('d-none');
    }
  } else {
    container.classList.add('d-none');
  }
  reserveModal.show();
}

document.getElementById('reserveForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorDiv = document.getElementById('reserveError');
  errorDiv.classList.add('d-none');

  const data = {
    table_id: document.getElementById('tableId').value,
    reservation_date: currentDate,
    start_time: document.getElementById('startTime').value,
    end_time: document.getElementById('endTime').value
  };

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

  try {
    await api.reservations.create(data);
    reserveModal.hide();
    loadTables();
    showToast('¡Reserva creada con éxito!', 'success');
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Confirmar Reserva';
  }
});

// Toast notification
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  const color = type === 'success' ? 'var(--primary)' : 'var(--danger)';
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:var(--bg-700);border:1px solid ${color};color:${color};padding:14px 22px;border-radius:12px;font-weight:600;font-size:.9rem;box-shadow:var(--shadow);z-index:9999;animation:slideUp .3s ease`;
  t.textContent = (type === 'success' ? ' ' : ' ') + msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

loadTables();
