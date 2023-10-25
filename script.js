// Initialize the map
var map = L.map('map').setView([-17.77871073951463, -63.183472859962734], 13);

// Add a tile layer to the map (you can change the tile layer URL)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

var marker;

// Listen for a click event on the map
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

    // Send the data to your web service using AJAX or other methods.
    // Here's a basic example using the fetch API:
    fetch('http://127.0.0.1:3000/pedidos/', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); // Handle the response from your web service
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
