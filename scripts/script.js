// Initialize the map
var map = L.map('map').setView([-17.77871073951463, -63.183472859962734], 13);

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
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);


get_pedidos_pendientes(map);

let restaurant_location = {"lat": -17.757198187751786,"lng":-63.168725967407234};

var marker;
var restaurant_marker;

restaurant_marker = L.marker(restaurant_location, { icon: restaurantIcon }).addTo(map);

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
document.getElementById('submitBtn').addEventListener('click', function() {
    // Gather form data
    var formData = {
        pedido_id: document.getElementById('pedido_id').value,
        pedido_latitud: document.getElementById('pedido_latitud').value,
        pedido_longitud: document.getElementById('pedido_longitud').value,
        pedido_pais: document.getElementById('pedido_pais').value,
        pedido_ciudad: document.getElementById('pedido_ciudad').value,
        pedido_celular: document.getElementById('pedido_celular').value,
    };

    if(formData.pedido_id == "" || formData.pedido_latitud == "" || formData.pedido_longitud == "") {
        document.getElementById('errorModal').style.display = 'block';
        return;
    }

    fetch('https://envios-26fg.onrender.com/pedidos/', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.acknowledged === true) {
            // Show the success modal
            document.getElementById('successModal').style.display = 'block';

            // Clear the form
            document.getElementById('pedido_id').value = '';
            document.getElementById('pedido_latitud').value = '';
            document.getElementById('pedido_longitud').value = '';
            document.getElementById('pedido_pais').value = '';
            document.getElementById('pedido_ciudad').value = '';
            document.getElementById('pedido_celular').value = '';
        } else {
            // Show the error modal
            document.getElementById('errorModal').style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Show the error modal in case of a network error
        document.getElementById('errorModal').style.display = 'block';
    });
});

// Cerrar los modales cuando se haga clic en la "x"
document.getElementById('closeSuccessModal').addEventListener('click', function() {
    document.getElementById('successModal').style.display = 'none';
});

document.getElementById('closeErrorModal').addEventListener('click', function() {
    document.getElementById('errorModal').style.display = 'none';
});


function moveMarker(newLat,newLng) {
    // Mueve el marcador a la nueva posición
    marker.setLatLng([newLat, newLng]);

    // Actualiza los campos de entrada con la nueva latitud y longitud
    document.getElementById('pedido_latitud').value = newLat;
    document.getElementById('pedido_longitud').value = newLng;
}