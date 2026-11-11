const API_URL = false ? "http://localhost:3000" : 'https://envios-rdb6.onrender.com';
const PEDIDO_COLUMNS = [
  ['pedido_celular', 'Celular'], ['pedido_nombre', 'Nombre'], ['pedido_cantidad', 'Cantidad'],
  ['pedido_estado', 'Estado'], ['pedido_tipo', 'Tipo'], ['pedido_hora_entrega', 'Hora'],
  ['pedido_turno', 'Horario'], ['pedido_zona', 'Zona'], ['pedido_comentarios', 'Comentarios'],
  ['pedido_vendedor', 'Vendedor']
];
const VALID_STATES = ['ENCARGADO', 'Pagado/Entregado'];
const VALID_TYPES = ['En lugar', 'Delivery'];
let pedidosGlobales = [];
let deliveries = [];
let storeMap = null;
let storeMarker = null;
let storeLocation = null;

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-api-key': obtenerApiKey(), ...(options.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(body || 'No se pudo completar la solicitud.');
  return body ? JSON.parse(body) : null;
}

async function obtenerPedidos() { return api('/pedidos'); }
async function cargarDeliveries() { deliveries = await api('/pedidos/deliveries/list'); }
function slugify(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function safeText(value) { return value == null ? '' : String(value); }
function mostrarCoordenadas(location) {
  document.getElementById('storeCoordinates').textContent = `Lat ${Number(location.lat).toFixed(6)} · Lng ${Number(location.lng).toFixed(6)}`;
}

async function initializeStoreMap() {
  if (storeMap) { setTimeout(() => storeMap.invalidateSize(), 60); return; }
  try {
    storeLocation = await api('/pedidos/store-location');
    storeMap = L.map('storeMap').setView([storeLocation.lat, storeLocation.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(storeMap);
    storeMarker = L.marker([storeLocation.lat, storeLocation.lng], { draggable: true }).addTo(storeMap);
    storeMarker.on('dragend', event => {
      const point = event.target.getLatLng(); storeLocation = { lat: point.lat, lng: point.lng }; mostrarCoordenadas(storeLocation);
    });
    storeMap.on('click', event => {
      storeLocation = { lat: event.latlng.lat, lng: event.latlng.lng }; storeMarker.setLatLng(event.latlng); mostrarCoordenadas(storeLocation);
    });
    mostrarCoordenadas(storeLocation);
  } catch (error) {
    document.getElementById('storeLocationStatus').textContent = 'No se pudo cargar el mapa. Intenta de nuevo.';
    console.error(error);
  }
}

async function guardarDeliveries() {
  await api('/pedidos/deliveries/list', { method: 'POST', body: JSON.stringify({ deliveries }) });
  llenarFiltroDeliveries();
  dibujarDeliveries();
  dibujarTablaFiltrada();
}

function llenarFiltroDeliveries() {
  const select = document.getElementById('filterDelivery');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Todos los deliveries</option>';
  deliveries.forEach(d => {
    const option = document.createElement('option'); option.value = d.id; option.textContent = d.nombre; select.appendChild(option);
  });
  select.value = current;
}

function dibujarDeliveries() {
  const list = document.getElementById('deliveryList');
  if (!list) return;
  list.replaceChildren();
  deliveries.forEach(delivery => {
    const row = document.createElement('div'); row.className = 'delivery-row';
    const name = document.createElement('strong'); name.textContent = delivery.nombre;
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn'; copy.textContent = 'Copiar enlace';
    copy.addEventListener('click', async () => {
      const url = new URL('../delivery/index.html', window.location.href); url.searchParams.set('delivery', delivery.id);
      try { await navigator.clipboard.writeText(url.href); copy.textContent = 'Enlace copiado'; }
      catch { window.prompt('Copia este enlace:', url.href); }
      setTimeout(() => { copy.textContent = 'Copiar enlace'; }, 1800);
    });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn danger'; remove.textContent = 'Eliminar';
    remove.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar a ${delivery.nombre} de la lista de deliveries?`)) return;
      deliveries = deliveries.filter(item => item.id !== delivery.id);
      try { await guardarDeliveries(); }
      catch (error) { alert('No se pudo guardar la lista.'); console.error(error); }
    });
    row.append(name, copy, remove); list.appendChild(row);
  });
}

function horaEnMinutos(value) {
  const match = safeText(value).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}

function filtrarPedidos() {
  const delivery = document.getElementById('filterDelivery').value;
  const status = document.getElementById('filterStatus').value;
  const turno = document.getElementById('filterTurno').value;
  const hour = document.getElementById('filterHour').value;
  const minutes = hour ? Number(hour.slice(0, 2)) * 60 + Number(hour.slice(3, 5)) : null;
  return pedidosGlobales.filter(p => (!delivery || p.delivery === delivery) && (!status || p.pedido_estado === status) && (!turno || p.pedido_turno === turno) && (minutes === null || horaEnMinutos(p.pedido_hora_entrega) === minutes));
}

function dibujarTablaFiltrada() { dibujarTabla(filtrarPedidos()); }

function dibujarTabla(pedidos) {
  const container = document.getElementById('no-more-tables');
  if (!container) return;
  container.replaceChildren();
  if (!pedidos.length) { container.innerHTML = '<p class="panel">No hay pedidos que coincidan con estos filtros.</p>'; return; }
  const wrapper = document.createElement('div'); wrapper.className = 'table-responsive panel';
  const table = document.createElement('table'); table.className = 'table table-bordered table-striped table-hover';
  const head = table.createTHead().insertRow();
  PEDIDO_COLUMNS.forEach(([, label]) => { const th = document.createElement('th'); th.textContent = label; head.appendChild(th); });
  ['Delivery', 'Acciones'].forEach(label => { const th = document.createElement('th'); th.textContent = label; head.appendChild(th); });
  const body = table.createTBody();
  pedidos.forEach(pedido => {
    const row = body.insertRow();
    PEDIDO_COLUMNS.forEach(([key, label]) => {
      const cell = row.insertCell(); cell.dataset.title = label; cell.textContent = safeText(pedido[key]);
      if (key === 'pedido_celular' && pedido[key]) { const link = document.createElement('a'); link.href = `https://wa.me/591${encodeURIComponent(pedido[key])}`; link.target = '_blank'; link.rel = 'noopener'; link.textContent = safeText(pedido[key]); cell.replaceChildren(link); }
    });
    const deliveryCell = row.insertCell(); deliveryCell.dataset.title = 'Delivery';
    const select = document.createElement('select'); select.className = 'delivery-select';
    const none = document.createElement('option'); none.value = ''; none.textContent = 'Sin asignar'; select.appendChild(none);
    deliveries.forEach(d => { const option = document.createElement('option'); option.value = d.id; option.textContent = d.nombre; option.selected = pedido.delivery === d.id; select.appendChild(option); });
    select.value = pedido.delivery || '';
    select.addEventListener('change', async () => {
      const prior = pedido.delivery || ''; select.disabled = true;
      try { await api(`/pedidos/delivery/${pedido._id}`, { method: 'PUT', body: JSON.stringify({ delivery: select.value }) }); pedido.delivery = select.value; }
      catch (error) { select.value = prior; alert('No se pudo asignar el delivery.'); console.error(error); }
      finally { select.disabled = false; }
    });
    deliveryCell.appendChild(select);
    const actions = row.insertCell(); actions.dataset.title = 'Acciones';
    const actionButtons = document.createElement('div'); actionButtons.className = 'action-buttons';
    if (pedido.pedido_latitud && pedido.pedido_longitud) {
      const map = document.createElement('a'); map.className = 'btn map-btn'; map.href = `https://www.google.com/maps/place/${pedido.pedido_latitud},${pedido.pedido_longitud}`; map.target = '_blank'; map.rel = 'noopener'; map.setAttribute('aria-label', 'Ver ubicación en mapa');
      const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = '📍 ';
      map.append(icon, document.createTextNode('Ver en mapa')); actionButtons.appendChild(map);
    }
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn danger'; remove.textContent = 'Eliminar';
    remove.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar el pedido de ${pedido.pedido_nombre || 'este cliente'}? Esta acción no se puede deshacer.`)) return;
      remove.disabled = true;
      try { await api(`/pedidos/${pedido._id}`, { method: 'DELETE' }); pedidosGlobales = pedidosGlobales.filter(item => item._id !== pedido._id); dibujarTablaFiltrada(); }
      catch (error) { remove.disabled = false; alert('No se pudo eliminar el pedido.'); console.error(error); }
    });
    actionButtons.appendChild(remove); actions.appendChild(actionButtons);
  });
  wrapper.appendChild(table); container.appendChild(wrapper);
}

function celda(row, key) { return safeText(row[key]).trim(); }
const IMPORT_FIELDS = ['pedido_latitud','pedido_longitud','pedido_celular','pedido_nombre','pedido_cantidad','pedido_estado','pedido_tipo','pedido_hora_entrega','pedido_turno','pedido_zona','pedido_comentarios','pedido_vendedor'];
function clavePedido(pedido) {
  return JSON.stringify(IMPORT_FIELDS.map(key => safeText(pedido[key]).normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase()));
}
function filasDesdeExcel(sheet) { return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }); }
function validarFila(row, index) {
  const line = index + 2;
  const required = ['pedido_celular','pedido_nombre','pedido_cantidad','pedido_estado','pedido_tipo','pedido_hora_entrega','pedido_zona','pedido_comentarios','pedido_vendedor'];
  const missing = required.filter(key => !celda(row, key));
  if (missing.length) return `Fila ${line}: faltan ${missing.join(', ')}.`;
  if (!VALID_STATES.includes(celda(row, 'pedido_estado'))) return `Fila ${line}: estado no permitido.`;
  if (!VALID_TYPES.includes(celda(row, 'pedido_tipo'))) return `Fila ${line}: tipo de entrega no permitido.`;
  if (!/^(0?[1-9]|1[0-2]):[0-5]\d\s*(AM|PM)$/i.test(celda(row, 'pedido_hora_entrega'))) return `Fila ${line}: la hora debe tener formato 12 horas y AM o PM (ej.: 2:30 PM).`;
  const lat = celda(row, 'pedido_latitud'), lng = celda(row, 'pedido_longitud');
  if ((lat && !lng) || (!lat && lng)) return `Fila ${line}: completa latitud y longitud juntas o deja ambas vacías.`;
  if (lat && (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)))) return `Fila ${line}: ubicación inválida.`;
  if (celda(row, 'pedido_turno') && !['Medio día', 'Noche'].includes(celda(row, 'pedido_turno'))) return `Fila ${line}: turno debe ser Medio día o Noche.`;
  return null;
}

async function importarExcel() {
  const input = document.getElementById('excelFile'); const status = document.getElementById('importStatus');
  if (!input.files.length) { status.textContent = 'Selecciona un archivo Excel.'; return; }
  const workbook = XLSX.read(await input.files[0].arrayBuffer(), { type: 'array' });
  const rows = filasDesdeExcel(workbook.Sheets[workbook.SheetNames[0]]);
  if (!rows.length) { status.textContent = 'El archivo no contiene pedidos.'; return; }
  const error = rows.map(validarFila).find(Boolean);
  if (error) { status.textContent = error; return; }
  const importButton = document.getElementById('importButton');
  importButton.disabled = true; status.textContent = 'Importando pedidos…';
  try {
    const pedidosActuales = await obtenerPedidos();
    const clavesExistentes = new Set(pedidosActuales.map(clavePedido));
    const pedidosNuevos = [];
    let duplicados = 0;
    for (const row of rows) {
      const pedido = Object.fromEntries(IMPORT_FIELDS.map(key => [key, celda(row, key)]));
      const key = clavePedido(pedido);
      if (clavesExistentes.has(key)) { duplicados++; continue; }
      clavesExistentes.add(key);
      pedidosNuevos.push(pedido);
    }
    for (const pedido of pedidosNuevos) {
      await api('/pedidos', { method: 'POST', body: JSON.stringify(pedido) });
    }
    pedidosGlobales = await obtenerPedidos(); dibujarTablaFiltrada(); input.value = ''; mostrarArchivoSeleccionado();
    status.textContent = pedidosNuevos.length
      ? `${pedidosNuevos.length} pedido(s) importado(s); ${duplicados} duplicado(s) omitido(s).`
      : `No había pedidos nuevos. Se omitieron ${duplicados} duplicado(s).`;
  } catch (error) { status.textContent = `La importación se detuvo: ${error.message}`; console.error(error); }
  finally { importButton.disabled = false; }
}

document.getElementById('ordersTab').addEventListener('click', () => { document.getElementById('ordersPanel').classList.remove('hidden'); document.getElementById('deliveriesPanel').classList.add('hidden'); document.getElementById('ordersTab').classList.add('active'); document.getElementById('deliveriesTab').classList.remove('active'); });
document.getElementById('deliveriesTab').addEventListener('click', () => { document.getElementById('deliveriesPanel').classList.remove('hidden'); document.getElementById('ordersPanel').classList.add('hidden'); document.getElementById('deliveriesTab').classList.add('active'); document.getElementById('ordersTab').classList.remove('active'); initializeStoreMap(); });
document.getElementById('deliveryForm').addEventListener('submit', async event => {
  event.preventDefault(); const name = document.getElementById('deliveryName').value.trim(); const id = slugify(name);
  if (!id || deliveries.some(d => d.id === id)) { document.getElementById('deliveryStatus').textContent = 'Ese nombre ya existe o no es válido.'; return; }
  deliveries.push({ id, nombre: name });
  try { await guardarDeliveries(); event.target.reset(); document.getElementById('deliveryStatus').textContent = 'Delivery agregado.'; }
  catch (error) { deliveries.pop(); document.getElementById('deliveryStatus').textContent = 'No se pudo guardar el delivery.'; console.error(error); }
});
document.getElementById('importButton').addEventListener('click', importarExcel);
const excelInput = document.getElementById('excelFile');
const dropZone = document.getElementById('fileDropZone');
const selectedFile = document.getElementById('selectedFile');
function mostrarArchivoSeleccionado() {
  selectedFile.textContent = excelInput.files.length ? excelInput.files[0].name : 'Ningún archivo seleccionado';
}
document.getElementById('chooseFile').addEventListener('click', () => excelInput.click());
excelInput.addEventListener('change', mostrarArchivoSeleccionado);
dropZone.addEventListener('dragover', event => { event.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', event => {
  event.preventDefault(); dropZone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (!file || !/\.xlsx?$/i.test(file.name)) { document.getElementById('importStatus').textContent = 'Selecciona un archivo .xlsx o .xls.'; return; }
  const transfer = new DataTransfer(); transfer.items.add(file); excelInput.files = transfer.files; mostrarArchivoSeleccionado();
  document.getElementById('importStatus').textContent = '';
});
document.getElementById('saveStoreLocation').addEventListener('click', async event => {
  if (!storeLocation) return;
  const button = event.currentTarget; const status = document.getElementById('storeLocationStatus'); button.disabled = true; status.textContent = 'Guardando ubicación…';
  try {
    storeLocation = await api('/pedidos/store-location', { method: 'PUT', body: JSON.stringify(storeLocation) });
    mostrarCoordenadas(storeLocation); status.textContent = 'Ubicación del local guardada.';
  } catch (error) { status.textContent = 'No se pudo guardar la ubicación.'; console.error(error); }
  finally { button.disabled = false; }
});
['filterDelivery','filterStatus','filterTurno','filterHour'].forEach(id => document.getElementById(id).addEventListener('input', dibujarTablaFiltrada));
document.getElementById('clearFilters').addEventListener('click', () => { ['filterDelivery','filterStatus','filterTurno','filterHour'].forEach(id => { document.getElementById(id).value = ''; }); dibujarTablaFiltrada(); });

(async () => {
  try { [pedidosGlobales, deliveries] = await Promise.all([obtenerPedidos(), cargarDeliveries().then(() => deliveries)]); llenarFiltroDeliveries(); dibujarDeliveries(); dibujarTablaFiltrada(); }
  catch (error) { document.getElementById('importStatus').textContent = `No se pudieron cargar los pedidos: ${error.message}`; console.error(error); }
})();
