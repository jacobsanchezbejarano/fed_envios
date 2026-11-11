const params = new URLSearchParams(window.location.search);
const deliveryId = params.get('delivery') || '';
const API_URL = false ? 'http://localhost:3000' : 'https://envios-rdb6.onrender.com';
let pedidosAsignados = [];

function obtenerApiKey() {
  let key = localStorage.getItem('apiKey');
  if (!key) {
    key = prompt('Ingresa tu API Key para actualizar el estado de un pedido:');
    if (key) localStorage.setItem('apiKey', key);
  }
  return key || '';
}

function crearElemento(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function agregarDetalle(container, label, value) {
  const item = document.createElement('div');
  item.appendChild(crearElemento('span', 'detail-label', label));
  item.appendChild(crearElemento('span', 'detail-value', value || '—'));
  container.appendChild(item);
}

function dibujarPedidos() {
  const list = document.getElementById('ordersList');
  const delivered = pedidosAsignados.filter(p => p.pedido_estado === 'Pagado/Entregado').length;
  const pending = pedidosAsignados.length - delivered;
  document.getElementById('summary').textContent = `${pending} pendiente${pending === 1 ? '' : 's'}`;
  document.getElementById('orderCount').textContent = `${pedidosAsignados.length} en total`;
  list.replaceChildren();

  if (!pedidosAsignados.length) {
    const empty = crearElemento('div', 'empty');
    empty.appendChild(crearElemento('div', 'empty-icon', '✨'));
    empty.appendChild(crearElemento('h3', '', 'Todo listo por ahora'));
    empty.appendChild(crearElemento('p', '', 'Cuando te asignen pedidos, aparecerán aquí.'));
    list.appendChild(empty);
    return;
  }

  pedidosAsignados.forEach(pedido => {
    const card = crearElemento('article', 'order-card');
    const heading = crearElemento('div', 'order-heading');
    const titleGroup = document.createElement('div');
    titleGroup.appendChild(crearElemento('h3', '', pedido.pedido_nombre || 'Pedido'));
    const isDone = pedido.pedido_estado === 'Pagado/Entregado';
    heading.append(titleGroup, crearElemento('span', `badge${isDone ? ' done' : ''}`, isDone ? 'Entregado' : pedido.pedido_estado || 'Pendiente'));
    card.appendChild(heading);

    const details = crearElemento('div', 'details');
    agregarDetalle(details, 'Hora de entrega', pedido.pedido_hora_entrega);
    agregarDetalle(details, 'Horario', pedido.pedido_turno);
    agregarDetalle(details, 'Cantidad', pedido.pedido_cantidad);
    agregarDetalle(details, 'Tipo de entrega', pedido.pedido_tipo);
    agregarDetalle(details, 'Zona', pedido.pedido_zona);
    agregarDetalle(details, 'Vendedor', pedido.pedido_vendedor);
    card.appendChild(details);

    if (pedido.pedido_comentarios) card.appendChild(crearElemento('p', 'comment', `Nota: ${pedido.pedido_comentarios}`));
    const actions = crearElemento('div', 'actions');
    if (pedido.pedido_latitud && pedido.pedido_longitud) {
      const map = crearElemento('a', 'button button-primary', '📍 Navegar al pedido ↗');
      map.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${pedido.pedido_latitud},${pedido.pedido_longitud}`)}`;
      map.target = '_blank'; map.rel = 'noopener'; actions.appendChild(map);
    }
    if (pedido.pedido_celular) {
      const whatsapp = crearElemento('a', 'button button-light', `WhatsApp · ${pedido.pedido_celular}`);
      whatsapp.href = `https://wa.me/591${encodeURIComponent(pedido.pedido_celular)}`;
      whatsapp.target = '_blank'; whatsapp.rel = 'noopener'; actions.appendChild(whatsapp);
    }
    if (!isDone) {
      const doneButton = crearElemento('button', 'button button-success', '✓ Marcar entregado');
      doneButton.type = 'button';
      doneButton.addEventListener('click', () => marcarComoEntregado(pedido, doneButton));
      actions.appendChild(doneButton);
    }
    if (actions.childNodes.length) card.appendChild(actions);
    list.appendChild(card);
  });
}

async function marcarComoEntregado(pedido, button) {
  if (!confirm(`¿Marcar el pedido de ${pedido.pedido_nombre || 'este cliente'} como entregado?`)) return;
  const apiKey = obtenerApiKey();
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
    dibujarPedidos();
  } catch (error) {
    button.disabled = false;
    alert(`${error.message} Revisa tu API Key e inténtalo de nuevo.`);
  }
}

async function cargarPedidos() {
  if (!deliveryId) throw new Error('El enlace no incluye un delivery asignado.');
  const response = await fetch(`${API_URL}/pedidos/delivery/${encodeURIComponent(deliveryId)}`);
  if (!response.ok) throw new Error('No se pudieron cargar los pedidos asignados.');
  pedidosAsignados = await response.json();
  const deliveriesResponse = await fetch(`${API_URL}/pedidos/deliveries/list`);
  if (deliveriesResponse.ok) {
    const deliveries = await deliveriesResponse.json();
    const current = deliveries.find(item => item.id === deliveryId);
    if (current) document.getElementById('deliveryName').textContent = current.nombre;
  }
  const locationResponse = await fetch(`${API_URL}/pedidos/store-location`);
  if (locationResponse.ok) {
    const location = await locationResponse.json();
    if (location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng))) {
      const link = document.getElementById('storeLink');
      link.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location.lat},${location.lng}`)}`;
      document.getElementById('storeCard').hidden = false;
    }
  }
  dibujarPedidos();
}

cargarPedidos().catch(error => {
  const list = document.getElementById('ordersList');
  list.replaceChildren(crearElemento('div', 'error', error.message));
  document.getElementById('summary').textContent = 'No disponible';
  document.getElementById('orderCount').textContent = '';
});
