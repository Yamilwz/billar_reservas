let currentDate = new Date().toISOString().split('T')[0];
document.getElementById('date-picker').value = currentDate;

// Store the current table's price per hour for calculations
let currentPricePerHour = 0;

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

    // Si falló la carga de las mesas, mostrar el error real
    if (tablesResult.status === 'rejected') {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert-dark-danger">
            Error al cargar las mesas: ${tablesResult.reason.message || 'Error del servidor'}
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
        <div class="table-card ${statusClass}" onclick="${isAvailable ? `openReserveModal(${table.id}, ${table.table_number}, ${table.price_per_hour}, '${slotsJson}')` : ''}">
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
              ${isAvailable ? `onclick="event.stopPropagation(); openReserveModal(${table.id}, ${table.table_number}, ${table.price_per_hour}, '${slotsJson}')"` : 'disabled'}>
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

function openReserveModal(id, number, pricePerHour, slotsJson) {
  if (!localStorage.getItem('token')) {
    window.location.href = '/login.html';
    return;
  }
  document.getElementById('tableId').value = id;
  document.getElementById('tablePricePerHour').value = pricePerHour;
  document.getElementById('modal-table-num').innerText = number;
  document.getElementById('reserveError').classList.add('d-none');
  currentPricePerHour = parseFloat(pricePerHour);

  // Reset time inputs
  document.getElementById('startTime').value = '';
  document.getElementById('endTime').value = '';

  // Reset price section
  document.getElementById('priceCalcSection').classList.add('d-none');
  document.getElementById('qrPaymentSection').classList.add('d-none');
  document.getElementById('receiptSection').classList.add('d-none');
  document.getElementById('receiptPreview').classList.add('d-none');

  // Reset receipt input
  const receiptInput = document.getElementById('receiptInput');
  receiptInput.value = '';
  receiptInput.required = true;

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

// --- Dynamic price calculation ---
function updatePriceCalculation() {
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;

  const priceSection = document.getElementById('priceCalcSection');
  const qrSection = document.getElementById('qrPaymentSection');
  const receiptSection = document.getElementById('receiptSection');

  if (!startTime || !endTime) {
    priceSection.classList.add('d-none');
    qrSection.classList.add('d-none');
    receiptSection.classList.add('d-none');
    return;
  }

  const start = new Date(`1970-01-01T${startTime}Z`);
  const end   = new Date(`1970-01-01T${endTime}Z`);
  const durationHours = (end - start) / (1000 * 60 * 60);

  if (durationHours <= 0) {
    priceSection.classList.add('d-none');
    qrSection.classList.add('d-none');
    receiptSection.classList.add('d-none');
    return;
  }

  const total = currentPricePerHour * durationHours;
  const advance = total * 0.5;

  document.getElementById('totalPriceDisplay').textContent = `Bs ${total.toFixed(2)}`;
  document.getElementById('advancePriceDisplay').textContent = `Bs ${advance.toFixed(2)}`;

  priceSection.classList.remove('d-none');
  qrSection.classList.remove('d-none');
  receiptSection.classList.remove('d-none');
}

document.getElementById('startTime').addEventListener('change', updatePriceCalculation);
document.getElementById('endTime').addEventListener('change', updatePriceCalculation);

// --- Receipt image preview ---
document.getElementById('receiptInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const previewContainer = document.getElementById('receiptPreview');
  const previewImg = document.getElementById('receiptPreviewImg');

  if (file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      previewImg.src = ev.target.result;
      previewContainer.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  } else {
    previewContainer.classList.add('d-none');
  }
});

// --- Convert file to Base64 ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Form submission ---
document.getElementById('reserveForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorDiv = document.getElementById('reserveError');
  errorDiv.classList.add('d-none');

  const receiptFile = document.getElementById('receiptInput').files[0];
  if (!receiptFile) {
    errorDiv.textContent = 'Debes subir el comprobante de pago para confirmar la reserva.';
    errorDiv.classList.remove('d-none');
    return;
  }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

  try {
    // Convert receipt to Base64
    const receipt_base64 = await fileToBase64(receiptFile);

    const data = {
      table_id: document.getElementById('tableId').value,
      reservation_date: currentDate,
      start_time: document.getElementById('startTime').value,
      end_time: document.getElementById('endTime').value,
      receipt_base64: receipt_base64
    };

    await api.reservations.create(data);
    reserveModal.hide();
    loadTables();
    showToast('¡Reserva creada con éxito! Tu comprobante fue enviado.', 'success');
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
