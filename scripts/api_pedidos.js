async function enviarPedido(event) {
    event.preventDefault(); // Previene el comportamiento predeterminado del formulario
  
    const formData = new FormData(document.getElementById("pedidoForm"));
    const data = Object.fromEntries(formData.entries());
  
    try {
      const response = await fetch('https://envios-26fg.onrender.com/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) {
        throw new Error('Error al enviar los datos a la API.');
      }
  
      console.log('Datos enviados exitosamente:', await response.json());
      alert('Datos enviados exitosamente');
      document.getElementById("pedidoForm").reset();
      map.setView([defaultLat, defaultLng], 13);
    } catch (error) {
      console.error('Error al enviar los datos a la API:', error);
    }
  }

  async function obtenerPedidos() {
    try {
      const response = await fetch('https://envios-26fg.onrender.com/pedidos');
      if (!response.ok) {
        throw new Error('Error al obtener los pedidos.');
      }
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
      throw error;
    }
  }

  
  function dibujarTabla(pedidos) {
    const tabla = document.createElement('table');
    const encabezado = tabla.createTHead();
    const filaEncabezado = encabezado.insertRow();
    
    var header_pedidos = [
      "Celular",
      "Nombre",
      "Cantidad",
      "Estado Pedido",
      "Tipo de Pedido",
      "Hora entrega",
      "Zona",
      "Comentarios",
      "Vendedor",
      "Acciones"
    ];
    for (const key of header_pedidos) {
      const th = document.createElement('th');
      th.textContent = key;
      filaEncabezado.appendChild(th);
    }
    const cuerpo = tabla.createTBody();
    pedidos.forEach(pedido => {
      const fila = cuerpo.insertRow();
      for (const key in pedido) {
        switch(key) {
            case 'pedido_celular':
            case 'pedido_nombre':
            case 'pedido_cantidad':
            case 'pedido_estado':
            case 'pedido_tipo':
            case 'pedido_hora_entrega':
            case 'pedido_zona':
            case 'pedido_comentarios':
            case 'pedido_vendedor':
                const celda = fila.insertCell();
                celda.textContent = pedido[key];
                break;
            default:
                // No hacer nada o manejar otros casos si es necesario
                break;
        }
    }
    
    // Después del bucle, agregar el enlace al final si corresponde
    if (pedido.pedido_latitud !== '') {
        var link = document.createElement('a');
        link.href = 'https://www.google.com/maps/place/' + pedido.pedido_latitud + ',' + pedido.pedido_longitud;
        link.target = '_blank';
        link.textContent = 'Ir a mapa';
        const celda = fila.insertCell();
        celda.appendChild(link);
    }
    
    });
    document.getElementById("lista_pedidos").appendChild(tabla);
  }
  

  (async () => {
    try {
      const pedidos = await obtenerPedidos();
      dibujarTabla(pedidos);
    } catch (error) {
      console.error('Error:', error);
    }
  })();
  
  function toggleSelect() {
    document.querySelector('.custom-select').classList.toggle('open');
}

// Coordenadas por defecto (Santa Cruz de la Sierra)
var defaultLat = -17.7834;
var defaultLng = -63.1821;

// Crear mapa centrado en las coordenadas por defecto
var map = L.map('map').setView([defaultLat, defaultLng], 13);

// Agregar capa de mapa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Marcar la ubicación en el mapa
var marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map)
    .bindPopup('Ubicación del pedido')
    .openPopup();

// Función para actualizar las coordenadas cuando el marcador se mueve
function updateMarker(lat, lng) {
    marker.setLatLng([lat, lng]);
    document.getElementById('pedido_latitud').value = lat;
    document.getElementById('pedido_longitud').value = lng;
}

// Manejador de eventos cuando el marcador se mueve
marker.on('dragend', function(event){
    var marker = event.target;
    var position = marker.getLatLng();
    var lat = position.lat;
    var lng = position.lng;
    updateMarker(lat, lng);
});

map.on('click', function(e) {
    if (marker) {
        // If a marker already exists, remove it
        map.removeLayer(marker);
    }

    // Create a marker at the clicked location
    marker = L.marker(e.latlng).addTo(map);


    // Update the latitude and longitude input fields
    document.getElementById('pedido_latitud').value = e.latlng.lat;
    document.getElementById('pedido_longitud').value = e.latlng.lng;
});

(async () => {
    try {
      const pedidos = await obtenerPedidos();
      dibujarTabla(pedidos);
    } catch (error) {
      console.error('Error:', error);
    }
  })();
  
