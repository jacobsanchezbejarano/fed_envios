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
        // ... (Tu código anterior)

        fetch('https://envios-26fg.onrender.com/pedidos/', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
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
