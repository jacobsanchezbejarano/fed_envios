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
  
