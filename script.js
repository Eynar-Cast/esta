const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const adminLoginPane = document.getElementById('admin-login');
const userLoginPane = document.getElementById('user-login');
const adminDashboard = document.getElementById('admin-dashboard');
const userDashboard = document.getElementById('user-dashboard');
const registerModal = document.getElementById('register-modal');
const loginButtons = document.querySelectorAll('.pill-btn');
const reserveButton = document.getElementById('reserve-spot');
const showQrButton = document.getElementById('show-qr');
const goRegisterButton = document.getElementById('go-register');
const closeModalButtons = document.querySelectorAll('.close-modal');
const registerSubmit = document.getElementById('register-submit');
const panelTitle = document.getElementById('panel-title');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const selectedSlotLabel = document.getElementById('selected-slot-label');
const reservationPrice = document.getElementById('reservation-price');
const toast = document.getElementById('toast');
const parkingGrid = document.getElementById('parking-grid');
const registerExitButton = document.getElementById('register-exit');
const activeSlotLabel = document.getElementById('active-slot');
const activeNote = document.getElementById('active-note');
const activeStartLabel = document.getElementById('active-start');
const activeEndLabel = document.getElementById('active-end');

const hourlyRate = 5;
const parkingSlots = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  status: [2, 5, 7, 9].includes(index + 1) ? 'occupied' : 'available',
}));
let selectedSlot = null;
let activeReservation = null;

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
  renderParkingGrid();
  updateSelectedSlotLabel();
});

loginButtons.forEach((button) => {
  button.addEventListener('click', () => {
    loginButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    const target = button.dataset.target;
    adminLoginPane.classList.toggle('hidden', target !== 'admin');
    userLoginPane.classList.toggle('hidden', target !== 'user');
  });
});

function showDashboard(type) {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
  userDashboard.classList.add('hidden');
  if (type === 'admin') {
    panelTitle.textContent = 'Panel Admin';
    adminDashboard.classList.remove('hidden');
  } else {
    panelTitle.textContent = 'Panel Usuario';
    userDashboard.classList.remove('hidden');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function parseTime(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function getDurationHours(start, end) {
  const duration = parseTime(end) - parseTime(start);
  return duration > 0 ? duration / 60 : 0;
}

function updateSelectedSlotLabel() {
  selectedSlotLabel.textContent = selectedSlot
    ? `Espacio ${selectedSlot.id} seleccionado`
    : 'Espacio no seleccionado';
}

function updateReservationSummary() {
  const duration = getDurationHours(startTimeInput.value, endTimeInput.value);
  if (!selectedSlot) {
    reservationPrice.textContent = 'Selecciona un espacio primero';
    return;
  }
  if (duration <= 0) {
    reservationPrice.textContent = 'Elige un intervalo válido';
    return;
  }
  reservationPrice.textContent = `Costo estimado: $${(duration * hourlyRate).toFixed(2)} (${duration.toFixed(1)}h)`;
}

let toastTimer = null;
function showMessage(message, type = 'success') {
  toast.textContent = message;
  toast.classList.toggle('error', type === 'error');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function renderParkingGrid() {
  parkingGrid.innerHTML = '';
  parkingSlots.forEach((slot) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `parking-slot ${slot.status}` + (selectedSlot === slot ? ' selected' : '');
    button.textContent = `#${slot.id}`;
    button.disabled = slot.status === 'occupied';
    button.addEventListener('click', () => {
      if (slot.status !== 'available') return;
      selectedSlot = slot;
      updateSelectedSlotLabel();
      updateReservationSummary();
      renderParkingGrid();
    });
    parkingGrid.appendChild(button);
  });
}

function clearActiveReservation() {
  selectedSlot = null;
  activeReservation = null;
  activeSlotLabel.textContent = 'Sin reserva';
  activeNote.textContent = 'Selecciona un espacio y horario para activar tu reserva.';
  activeStartLabel.textContent = '--:--';
  activeEndLabel.textContent = '--:--';
  renderParkingGrid();
  updateSelectedSlotLabel();
  updateReservationSummary();
}

document.getElementById('login-admin').addEventListener('click', () => showDashboard('admin'));
document.getElementById('login-user').addEventListener('click', () => showDashboard('user'));

goRegisterButton.addEventListener('click', () => {
  registerModal.classList.remove('hidden');
});

closeModalButtons.forEach((button) => {
  button.addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });
});

registerSubmit.addEventListener('click', () => {
  registerModal.classList.add('hidden');
  showMessage('Cuenta creada con éxito', 'success');
});

[startTimeInput, endTimeInput].forEach((input) => {
  input.addEventListener('change', updateReservationSummary);
});

reserveButton.addEventListener('click', () => {
  if (!selectedSlot) {
    showMessage('Selecciona un espacio disponible antes de reservar.', 'error');
    return;
  }

  const start = startTimeInput.value;
  const end = endTimeInput.value;
  const duration = getDurationHours(start, end);

  if (duration <= 0) {
    showMessage('Elige un intervalo válido con horas de inicio y fin.', 'error');
    return;
  }

  if (selectedSlot.status !== 'available') {
    showMessage('El espacio ya no está disponible.', 'error');
    return;
  }

  selectedSlot.status = 'occupied';
  activeReservation = {
    slot: selectedSlot,
    start,
    end,
    duration,
  };

  activeSlotLabel.textContent = `Espacio #${selectedSlot.id}`;
  activeNote.textContent = `Reservado de ${start} a ${end}`;
  activeStartLabel.textContent = start;
  activeEndLabel.textContent = end;

  renderParkingGrid();
  updateReservationSummary();
  showMessage(`Reserva confirmada en el espacio #${selectedSlot.id}. Total aprox. $${(duration * hourlyRate).toFixed(2)}`, 'success');
});

registerExitButton.addEventListener('click', () => {
  if (!activeReservation) {
    showMessage('No hay reserva activa para registrar salida.', 'error');
    return;
  }

  const now = new Date();
  const actualMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledEnd = parseTime(activeReservation.end);
  let extra = 0;

  if (actualMinutes > scheduledEnd) {
    extra = Math.ceil((actualMinutes - scheduledEnd) / 60) * hourlyRate;
  }

  const baseTotal = activeReservation.duration * hourlyRate;
  const totalToPay = baseTotal + extra;

  activeReservation.slot.status = 'available';
  clearActiveReservation();

  showMessage(
    extra > 0
      ? `Salida registrada. Pago adicional $${extra.toFixed(2)}. Total $${totalToPay.toFixed(2)}.`
      : `Salida registrada. Total $${totalToPay.toFixed(2)}. Gracias.`,
    'success'
  );
});

showQrButton.addEventListener('click', () => {
  showMessage('Pago exitoso', 'success');
});

const logoutButtons = document.querySelectorAll('.logout-btn');
logoutButtons.forEach((button) => {
  button.addEventListener('click', () => {
    loginScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
    adminLoginPane.classList.remove('hidden');
    userLoginPane.classList.add('hidden');
    loginButtons.forEach((btn) => btn.classList.remove('active'));
    document.querySelector('.pill-btn[data-target="admin"]').classList.add('active');
    panelTitle.textContent = 'Panel Admin';
  });
});
