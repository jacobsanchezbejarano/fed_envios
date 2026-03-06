// Initialize the map
// var map = L.map('map').setView([-17.77871073951463, -63.183472859962734], 13);
const API_URL = false ? "http://localhost:3000" : 'https://envios-6wpy.onrender.com';

function get_pedidos_pendientes(map) {
    var apiURL = `${API_URL}/pedidos`;

    fetch(apiURL,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "x-api-key": obtenerApiKey()
            },
        }
    )
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
                if(ubicacion.pedido_estado != 'Pagado/Entregado') {
                    var customIcon = L.icon({
                        iconUrl: 'https://cdn.icon-icons.com/icons2/1206/PNG/512/1491254387-pindestinationmaplocation_82942.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    });
    
                    // Crea y agrega el marcador al mapa con el ícono personalizado
                    var marker = L.marker([ubicacion.pedido_latitud, ubicacion.pedido_longitud], { icon: customIcon })
                        .addTo(map)
                        .bindPopup('<a class="btn" target="_blank" href="https://www.google.com/maps/place/' + ubicacion.pedido_latitud + ',' + ubicacion.pedido_longitud + '"><button style="background-color:#007bff; color:white">Navegar en maps</button></a><br>Pedido: ' + ubicacion.pedido_nombre + ' <br>Hora: '+ ubicacion.pedido_hora_entrega + '<br>Cantidad: '+ ubicacion.pedido_cantidad + '<br>Estado: '+ ubicacion.pedido_estado + ''+
                        '<br><a target="_blank" href="https://wa.me/591'+ ubicacion.pedido_celular+'"><button style="background-color:#25d366; color:#666">Celular: '+ ubicacion.pedido_celular+'</button></a>'+
                        '<br><p>Comentarios: ' + (ubicacion.pedido_comentarios ? ubicacion.pedido_comentarios : 'Sin comentarios')+'</p>'
                        );
                }
            });

            // Itera sobre los datos y agrega marcadores al mapa
            
        })
        .catch(error => {
            console.error('Error:', error);
        });
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
    iconUrl: 'images/restaurante.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Add a tile layer to the map (you can change the tile layer URL)
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
// }).addTo(map);


// get_pedidos_pendientes(map);

let restaurant_location = {"lat": -17.745771614638134,"lng":-63.14899362623692};


var marker;
var restaurant_marker;

// restaurant_marker = L.marker(restaurant_location, { icon: restaurantIcon }).
// addTo(map)
// .bindPopup('<a target="_blank" href="https://www.google.com/maps/place/' + restaurant_location.lat + ',' + restaurant_location.lng + '">Local</a>');

// Listen for a click event on the map
// map.on('click', function(e) {
//     if (marker) {
//         // If a marker already exists, remove it
//         map.removeLayer(marker);
//     }

//     // Create a marker at the clicked location
//     marker = L.marker(e.latlng, { icon: customIcon }).addTo(map);


//     // Update the latitude and longitude input fields
//     document.getElementById('pedido_latitud').value = e.latlng.lat;
//     document.getElementById('pedido_longitud').value = e.latlng.lng;
// });

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

//     fetch('https://envios-6wpy.onrender.com/pedidos/', {
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