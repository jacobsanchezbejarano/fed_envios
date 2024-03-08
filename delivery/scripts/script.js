// Initialize the map
const urlParams = new URLSearchParams(window.location.search);
const delivery = urlParams.get('delivery').toLowerCase();

var map = L.map('map').setView([-17.77871073951463, -63.183472859962734], 13);


function get_pedidos_pendientes(map, deliveryId) {
    var apiURL = `https://envios-26fg.onrender.com/pedidos/delivery/${deliveryId}`;
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

                let boton;

                if (ubicacion.pedido_estado !== 'Pagado/Entregado') {
                    // Crear el botón "Marcar entregado"
                    boton = '<button style="background-color:#000; color:#fff; padding: 5px; border-radius:10px" onclick="confirmarEntrega(\'' + ubicacion._id + '\')">Marcar entregado</button>';
                } else {
                    // Mostrar "ENTREGADO" en lugar de un botón
                    boton = '<p>ENTREGADO</p>';
                }

                // Crea y agrega el marcador al mapa con el ícono personalizado
                var marker = L.marker([ubicacion.pedido_latitud, ubicacion.pedido_longitud], { icon: customIcon })
                    .addTo(map)
                    .bindPopup('<a class="btn" target="_blank" href="https://www.google.com/maps/place/' + ubicacion.pedido_latitud + ',' + ubicacion.pedido_longitud + '"><button style="background-color:#007bff; color:white;padding: 5px;border-radius:10px">Navegar en maps</button></a><br>Pedido: ' + ubicacion.pedido_nombre + ' <br>Hora: '+ ubicacion.pedido_hora_entrega + '<br>Cantidad: '+ ubicacion.pedido_cantidad + '<br>Estado: '+ ubicacion.pedido_estado + ''+
                    '<br><a target="_blank" href="https://wa.me/591'+ ubicacion.pedido_celular+'"><button style="background-color:#25d366; color:#fff;padding: 5px;border-radius:10px">Whatsapp '+ ubicacion.pedido_celular+'</button></a>'+
                    '<br><br>' + boton
                    );
            });

            // Itera sobre los datos y agrega marcadores al mapa
            
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function confirmarEntrega(pedido_id) {
    const confirmacion = confirm('¿Desea marcar este pedido como entregado?');
    if (confirmacion) {
        marcarComoEntregado(pedido_id);
    }
}

async function marcarComoEntregado(idPedido) {
    try {
        const response = await fetch(`https://envios-26fg.onrender.com/pedidos/estado/${idPedido}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pedido_estado: 'Pagado/Entregado' }) // Estado a actualizar
        });
        if (!response.ok) {
            throw new Error('Error al marcar como entregado.');
        }
        // Refrescar la tabla o actualizar los datos si es necesario
        // Por ejemplo, puedes volver a obtener los pedidos y volver a dibujar la tabla
    } catch (error) {
        console.error('Error al marcar como entregado:', error);
        // Manejar el error si es necesario
    }
}

//LABEL AND ANCHOR
//<a target="_blank" href="https://www.google.com/maps/place/'+str(lat)+','+str(lon)+'">Pedido: '+pedido+'</a>


// Define un ícono personalizado
var customIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/75/75800.png',
    iconSize: [32, 32], // Tamaño del ícono
    iconAnchor: [16, 32], // Punto de anclaje del ícono
    popupAnchor: [0, -32] // Punto de anclaje del popup
});

var restaurantIcon = L.icon({
    iconUrl: '../images/restaurante.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Add a tile layer to the map (you can change the tile layer URL)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);


get_pedidos_pendientes(map, delivery);

let restaurant_location = {"lat": -17.7457066,"lng":-63.1517563};

var marker;
var restaurant_marker;

restaurant_marker = L.marker(restaurant_location, { icon: restaurantIcon }).
addTo(map)
.bindPopup('<a target="_blank" href="https://www.google.com/maps/place/' + ubicacion.pedido_latitud + ',' + ubicacion.pedido_longitud + '">Local</a>');

// Listen for a click event on the map
map.on('click', function(e) {
    if (marker) {
        // If a marker already exists, remove it
        map.removeLayer(marker);
    }

    // Create a marker at the clicked location
    marker = L.marker(e.latlng, { icon: customIcon }).addTo(map);


    // Update the latitude and longitude input fields
    document.getElementById('pedido_latitud').value = e.latlng.lat;
    document.getElementById('pedido_longitud').value = e.latlng.lng;
});

// Handle form submission
// document.getElementById('submitBtn').addEventListener('click', function() {
//     // Gather form data
//     var formData = {
//         pedido_id: document.getElementById('pedido_id').value,
//         pedido_latitud: document.getElementById('pedido_latitud').value,
//         pedido_longitud: document.getElementById('pedido_longitud').value,
//         pedido_pais: document.getElementById('pedido_pais').value,
//         pedido_ciudad: document.getElementById('pedido_ciudad').value,
//         pedido_celular: document.getElementById('pedido_celular').value,
//     };

//     if(formData.pedido_id == "" || formData.pedido_latitud == "" || formData.pedido_longitud == "") {
//         document.getElementById('errorModal').style.display = 'block';
//         return;
//     }

//     fetch('https://envios-26fg.onrender.com/pedidos/', {
//         method: 'POST',
//         body: JSON.stringify(formData),
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//         if (data.acknowledged === true) {
//             // Show the success modal
//             document.getElementById('successModal').style.display = 'block';

//             // Clear the form
//             document.getElementById('pedido_id').value = '';
//             document.getElementById('pedido_latitud').value = '';
//             document.getElementById('pedido_longitud').value = '';
//             document.getElementById('pedido_pais').value = '';
//             document.getElementById('pedido_ciudad').value = '';
//             document.getElementById('pedido_celular').value = '';
//         } else {
//             // Show the error modal
//             document.getElementById('errorModal').style.display = 'block';
//         }
//     })
//     .catch(error => {
//         console.error('Error:', error);
//         // Show the error modal in case of a network error
//         document.getElementById('errorModal').style.display = 'block';
//     });
// });

// Cerrar los modales cuando se haga clic en la "x"
// document.getElementById('closeSuccessModal').addEventListener('click', function() {
//     document.getElementById('successModal').style.display = 'none';
// });

// document.getElementById('closeErrorModal').addEventListener('click', function() {
//     document.getElementById('errorModal').style.display = 'none';
// });


function moveMarker(newLat,newLng) {
    // Mueve el marcador a la nueva posición
    marker.setLatLng([newLat, newLng]);

    // Actualiza los campos de entrada con la nueva latitud y longitud
    document.getElementById('pedido_latitud').value = newLat;
    document.getElementById('pedido_longitud').value = newLng;
}