function get_pedidos_pendientes(map) {
    var apiURL = 'https://envios-26fg.onrender.com/pedidos';

    fetch(apiURL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud a la API');
            }
            return response.json();
        })
        .then(data => {
            // Maneja los datos obtenidos de la API


            data.forEach(ubicacion => {
                // Crea un ícono personalizado para cada marcador
                var customIcon = L.icon({
                    iconUrl: 'https://cdn.icon-icons.com/icons2/1206/PNG/512/1491254387-pindestinationmaplocation_82942.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });

                // Crea y agrega el marcador al mapa con el ícono personalizado
                var marker = L.marker([ubicacion.pedido_latitud, ubicacion.pedido_longitud], { icon: customIcon })
                    .addTo(map)
                    .bindPopup(ubicacion.nombre); // Muestra el nombre en el popup
            });

            // Itera sobre los datos y agrega marcadores al mapa
            
        })
        .catch(error => {
            console.error('Error:', error);
        });
}