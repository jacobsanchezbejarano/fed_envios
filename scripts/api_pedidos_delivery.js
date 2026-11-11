const params = new URLSearchParams(window.location.search);
const deliveryId = params.get('delivery') || '';
const API_URL = false ? 'http://localhost:3000' : 'https://envios-rdb6.onrender.com';
const START_VIEW_KEY = 'delivery-start-view';
let pedidosAsignados = [];
let localLocation = { lat: -17.769703, lng: -63.164056 };
let deliveryMap = null;
let markersLayer = null;
let orderMarkers = new Map();
let mapBoundsSet = false;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function getApiKey() {
  let key = localStorage.getItem('apiKey');
  if (!key) {
    key = prompt('Ingresa tu API Key para actualizar el estado de un pedido:');
    if (key) localStorage.setItem('apiKey', key);
  }
  return key || '';
}

function tieneUbicacion(pedido) {
  return pedido.pedido_latitud != null && pedido.pedido_longitud != null &&
    String(pedido.pedido_latitud).trim() !== '' && String(pedido.pedido_longitud).trim() !== '' &&
    Number.isFinite(Number(pedido.pedido_latitud)) && Number.isFinite(Number(pedido.pedido_longitud));
}

function coordenadasPedido(pedido) {
  return [Number(pedido.pedido_latitud), Number(pedido.pedido_longitud)];
}

function mapUrl(location) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location[0]},${location[1]}`)}`;
}

function setPreferredView(view) {
  localStorage.setItem(START_VIEW_KEY, view);
  document.querySelectorAll('[data-start-view]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.startView === view));
  });
}

function setActiveView(view) {
  const isMap = view === 'map';
  document.getElementById('mapPanel').classList.toggle('hidden', !isMap);
  document.getElementById('summaryPanel').classList.toggle('hidden', isMap);
  document.getElementById('mapTab').setAttribute('aria-selected', String(isMap));
  document.getElementById('summaryTab').setAttribute('aria-selected', String(!isMap));
  if (isMap) {
    initializeMap();
    setTimeout(() => {
      if (!deliveryMap) return;
      deliveryMap.invalidateSize();
      if (!mapBoundsSet) ajustarMapa();
    }, 80);
  }
}

function markerIcon(done) {
  return L.divIcon({
    className: 'leaflet-div-icon',
    html: `<div class="map-pin${done ? ' done' : ''}"><span>${done ? '✓' : '📦'}</span></div>`,
    iconSize: [32, 38],
    iconAnchor: [16, 37],
    popupAnchor: [0, -34]
  });
}

function field(label, value) {
  const item = node('div');
  item.append(node('span', 'popup-label', label), node('span', 'popup-value', value || '—'));
  return item;
}

function crearPopupPedido(pedido) {
  const content = node('div', 'map-popup');
  const heading = node('div', 'popup-heading');
  const title = node('div');
  title.append(node('strong', '', pedido.pedido_nombre || 'Pedido'), node('div', 'popup-sub', `Estado: ${pedido.pedido_estado || 'Pendiente'}`));
  const badge = node('span', `badge${pedido.pedido_estado === 'Pagado/Entregado' ? ' done' : ''}`, pedido.pedido_estado === 'Pagado/Entregado' ? 'Entregado' : 'Pendiente');
  heading.append(title, badge); content.appendChild(heading);

  const grid = node('div', 'popup-grid');
  grid.append(
    field('Turno', pedido.pedido_turno),
    field('Forma de pago', pedido.pedido_forma_pago),
    field('Cantidad', pedido.pedido_cantidad),
    field('Tipo', pedido.pedido_tipo),
    field('Dirección', pedido.pedido_direccion),
    field('Zona', pedido.pedido_zona),
    field('Vendedor', pedido.pedido_vendedor)
  );
  content.appendChild(grid);
  if (pedido.pedido_comentarios) content.appendChild(node('p', 'popup-comment', `Nota: ${pedido.pedido_comentarios}`));

  const actions = node('div', 'popup-actions');
  const destination = coordenadasPedido(pedido);
  const navigate = node('a', 'button button-primary', '📍 Navegar al pedido');
  navigate.href = mapUrl(destination); navigate.target = '_blank'; navigate.rel = 'noopener';
  actions.appendChild(navigate);
  if (pedido.pedido_celular) {
    const whatsapp = node('a', 'button button-whatsapp', 'WhatsApp');
    whatsapp.href = `https://wa.me/591${encodeURIComponent(pedido.pedido_celular)}`; whatsapp.target = '_blank'; whatsapp.rel = 'noopener';
    whatsapp.setAttribute('aria-label', `Contactar por WhatsApp al ${pedido.pedido_celular}`);
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('width', '20'); icon.setAttribute('height', '20'); icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('fill', 'currentColor');
    const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glyph.setAttribute('d', 'M12.04 2a9.87 9.87 0 0 0-8.48 14.93L2 22l5.22-1.37A9.94 9.94 0 0 0 12.04 22h.01A10 10 0 0 0 22 12.01 9.99 9.99 0 0 0 12.04 2Zm0 18.2h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.18 8.18 0 1 1 6.96 3.85Zm4.49-6.13c-.25-.12-1.47-.73-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.78.98-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.16.04-.31-.02-.43-.07-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.01 2.59.12.16 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.57.21-1.06.14-1.17-.06-.1-.23-.16-.48-.29Z');
    icon.appendChild(glyph); whatsapp.prepend(icon);
    actions.appendChild(whatsapp);
  }
  if (pedido.pedido_estado !== 'Pagado/Entregado') {
    const done = node('button', 'button button-success', '✓ Marcar como entregado');
    done.type = 'button'; done.addEventListener('click', () => marcarComoEntregado(pedido, done)); actions.appendChild(done);
  }
  content.appendChild(actions);
  return content;
}

function crearPopupLocal() {
  const content = node('div', 'map-popup');
  content.append(node('strong', '', '📍 Local'), node('p', 'popup-sub', 'Punto de retiro para los pedidos.'));
  const link = node('a', 'button button-primary', 'Navegar al local ↗');
  link.href = mapUrl([Number(localLocation.lat), Number(localLocation.lng)]); link.target = '_blank'; link.rel = 'noopener';
  content.appendChild(link);
  return content;
}

function initializeMap() {
  if (deliveryMap || !window.L) return;
  const center = localLocation ? [Number(localLocation.lat), Number(localLocation.lng)] : [-17.769703, -63.164056];
  deliveryMap = L.map('deliveryMap', { zoomControl: true }).setView(center, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(deliveryMap);
  markersLayer = L.layerGroup().addTo(deliveryMap);
  renderMarkers();
}

function renderMarkers() {
  if (!deliveryMap) return;
  markersLayer.clearLayers();
  orderMarkers.clear();
  const bounds = [];
  if (localLocation && Number.isFinite(Number(localLocation.lat)) && Number.isFinite(Number(localLocation.lng))) {
    const localPoint = [Number(localLocation.lat), Number(localLocation.lng)];
    const icon = L.divIcon({ className: 'leaflet-div-icon', html: '<div class="store-marker">📍</div>', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -18] });
    L.marker(localPoint, { icon }).addTo(markersLayer).bindPopup(crearPopupLocal());
    bounds.push(localPoint);
  }
  pedidosAsignados.forEach(pedido => {
    if (!tieneUbicacion(pedido)) return;
    const point = coordenadasPedido(pedido);
    const marker = L.marker(point, { icon: markerIcon(pedido.pedido_estado === 'Pagado/Entregado') }).addTo(markersLayer);
    marker.bindPopup(crearPopupPedido(pedido));
    orderMarkers.set(String(pedido._id), marker);
    bounds.push(point);
  });
  if (bounds.length && !mapBoundsSet) {
    if (bounds.length === 1) deliveryMap.setView(bounds[0], 14);
    else deliveryMap.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
    mapBoundsSet = true;
  }
}

function ajustarMapa() {
  if (!deliveryMap) return;
  const bounds = [];
  if (localLocation) bounds.push([Number(localLocation.lat), Number(localLocation.lng)]);
  pedidosAsignados.filter(tieneUbicacion).forEach(pedido => bounds.push(coordenadasPedido(pedido)));
  if (bounds.length > 1) deliveryMap.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
  else if (bounds.length === 1) deliveryMap.setView(bounds[0], 14);
  mapBoundsSet = true;
}

function setSummaryCounts() {
  const delivered = pedidosAsignados.filter(p => p.pedido_estado === 'Pagado/Entregado').length;
  const pending = pedidosAsignados.length - delivered;
  const located = pedidosAsignados.filter(tieneUbicacion).length;
  document.getElementById('summaryCount').textContent = `${pending} pendiente${pending === 1 ? '' : 's'} · ${delivered} entregado${delivered === 1 ? '' : 's'}`;
  document.getElementById('mapCount').textContent = located;
  document.getElementById('summaryTabCount').textContent = pedidosAsignados.length;
  document.getElementById('mapLocatedCount').textContent = `${located} con ubicación`;
  const noLocation = pedidosAsignados.length - located;
  const note = document.getElementById('mapNote');
  note.hidden = noLocation === 0;
  if (noLocation) document.getElementById('mapNoteText').textContent = `${noLocation} pedido(s) sin ubicación aparecen en el resumen.`;
}

function addDetail(container, label, value) {
  const item = node('div');
  item.append(node('span', 'detail-label', label), node('span', 'detail-value', value || '—'));
  container.appendChild(item);
}

function dibujarResumen() {
  const list = document.getElementById('ordersList');
  list.replaceChildren();
  if (!pedidosAsignados.length) {
    const empty = node('div', 'empty');
    empty.append(node('div', 'empty-icon', '✨'), node('h3', '', 'Todo listo por ahora'), node('p', '', 'Cuando te asignen pedidos, aparecerán aquí.'));
    list.appendChild(empty); return;
  }
  pedidosAsignados.forEach(pedido => {
    const card = node('article', 'order-card');
    const heading = node('div', 'order-heading');
    const title = node('div'); title.appendChild(node('h3', '', pedido.pedido_nombre || 'Pedido'));
    const isDone = pedido.pedido_estado === 'Pagado/Entregado';
    heading.append(title, node('span', `badge${isDone ? ' done' : ''}`, isDone ? 'Entregado' : pedido.pedido_estado || 'Pendiente'));
    card.appendChild(heading);
    const details = node('div', 'details');
    addDetail(details, 'Turno', pedido.pedido_turno); addDetail(details, 'Forma de pago', pedido.pedido_forma_pago);
    addDetail(details, 'Cantidad', pedido.pedido_cantidad); addDetail(details, 'Tipo', pedido.pedido_tipo);
    addDetail(details, 'Dirección', pedido.pedido_direccion); addDetail(details, 'Zona', pedido.pedido_zona); addDetail(details, 'Vendedor', pedido.pedido_vendedor);
    card.appendChild(details);
    if (pedido.pedido_comentarios) card.appendChild(node('p', 'comment', `Nota: ${pedido.pedido_comentarios}`));
    const actions = node('div', 'actions');
    if (tieneUbicacion(pedido)) {
      const locate = node('button', 'button button-primary', '📍 Ver en mapa');
      locate.type = 'button'; locate.addEventListener('click', () => {
        setActiveView('map');
        setTimeout(() => { const marker = orderMarkers.get(String(pedido._id)); if (marker) { deliveryMap.setView(marker.getLatLng(), 16); marker.openPopup(); } }, 120);
      });
      actions.appendChild(locate);
    }
    if (pedido.pedido_celular) {
      const phone = node('a', 'button button-light', `WhatsApp · ${pedido.pedido_celular}`);
      phone.href = `https://wa.me/591${encodeURIComponent(pedido.pedido_celular)}`; phone.target = '_blank'; phone.rel = 'noopener'; actions.appendChild(phone);
    }
    if (!isDone) {
      const done = node('button', 'button button-success', '✓ Marcar entregado');
      done.type = 'button'; done.addEventListener('click', () => marcarComoEntregado(pedido, done)); actions.appendChild(done);
    }
    if (actions.childNodes.length) card.appendChild(actions);
    list.appendChild(card);
  });
}

async function marcarComoEntregado(pedido, button) {
  if (!confirm(`¿Marcar el pedido de ${pedido.pedido_nombre || 'este cliente'} como entregado?`)) return;
  const apiKey = getApiKey();
  if (!apiKey) return;
  button.disabled = true;
  try {
    const response = await fetch(`${API_URL}/pedidos/estado/${pedido._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ pedido_estado: 'Pagado/Entregado' })
    });
    if (!response.ok) throw new Error('No se pudo actualizar el pedido.');
    pedido.pedido_estado = 'Pagado/Entregado';
    setSummaryCounts(); dibujarResumen(); renderMarkers();
  } catch (error) {
    button.disabled = false;
    alert(`${error.message} Revisa tu API Key e inténtalo de nuevo.`);
  }
}

async function obtenerJson(path) {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error('No se pudo cargar la información.');
  return response.json();
}

async function cargarDatos() {
  if (!deliveryId) throw new Error('Este enlace no indica qué delivery debe consultar. Pide al administrador un enlace válido.');
  pedidosAsignados = await obtenerJson(`/pedidos/delivery/${encodeURIComponent(deliveryId)}`);
  const [deliveriesResult, locationResult] = await Promise.allSettled([
    obtenerJson('/pedidos/deliveries/list'),
    obtenerJson('/pedidos/store-location')
  ]);
  if (deliveriesResult.status === 'fulfilled') {
    const current = deliveriesResult.value.find(item => item.id === deliveryId);
    if (current) document.getElementById('deliveryName').textContent = current.nombre;
  } else document.getElementById('deliveryName').textContent = `Delivery ${deliveryId}`;
  if (locationResult.status === 'fulfilled') localLocation = locationResult.value;

  if (localLocation && Number.isFinite(Number(localLocation.lat)) && Number.isFinite(Number(localLocation.lng))) {
    const link = document.getElementById('storeLink');
    link.href = mapUrl([Number(localLocation.lat), Number(localLocation.lng)]);
    document.getElementById('storeCard').hidden = false;
  }
  setSummaryCounts(); dibujarResumen();
}

document.getElementById('mapTab').addEventListener('click', () => setActiveView('map'));
document.getElementById('summaryTab').addEventListener('click', () => setActiveView('summary'));
document.getElementById('showSummaryButton').addEventListener('click', () => setActiveView('summary'));
document.querySelectorAll('[data-start-view]').forEach(button => button.addEventListener('click', () => setPreferredView(button.dataset.startView)));

(async () => {
  try {
    await cargarDatos();
    const preferred = localStorage.getItem(START_VIEW_KEY) === 'summary' ? 'summary' : 'map';
    setPreferredView(preferred); setActiveView(preferred);
  } catch (error) {
    document.getElementById('ordersList').replaceChildren(node('div', 'error', error.message));
    document.getElementById('summaryCount').textContent = 'No disponible';
    document.getElementById('mapLocatedCount').textContent = '';
  }
})();
