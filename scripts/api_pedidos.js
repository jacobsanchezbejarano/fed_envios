const API_URL = true ? "http://localhost:3000" : 'https://envios-26fg.onrender.com';

// Lista predeterminada de deliveries
const deliveriesDisponibles = [
  { id: "josema", nombre: "Josema" },
  { id: "niki", nombre: "Niki" },
  { id: "dayana", nombre: "Dayana" },
  { id: "rolando", nombre: "Rolando" },
];

// =============================
// ENVIAR PEDIDO
// =============================
async function enviarPedido(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById("pedidoForm"));
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Error al enviar los datos a la API.');
      }

      alert('Datos enviados exitosamente');
      location.reload();

    } catch (error) {
      console.error('Error al enviar los datos a la API:', error);
    }
}

// =============================
// OBTENER PEDIDOS
// =============================
async function obtenerPedidos() {
    try {
      const response = await fetch(`${API_URL}/pedidos`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "x-api-key": obtenerApiKey()
            },
        }
      );
      if (!response.ok) {
        throw new Error('Error al obtener los pedidos.');
      }
      return await response.json();

    } catch (error) {
      console.error('Error al obtener los pedidos:', error);
      throw error;
    }
}

// =============================
// ASIGNAR DELIVERY
// =============================
async function asignarDelivery(idPedido, deliveryId, selectElement) {
    try {

        selectElement.disabled = true;

        const response = await fetch(`${API_URL}/pedidos/delivery/${idPedido}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                "x-api-key": obtenerApiKey()
            },
            body: JSON.stringify({ delivery: deliveryId })
        });

        if (!response.ok) {
            throw new Error('Error al asignar delivery');
        }

        console.log("Delivery asignado correctamente");

    } catch (error) {
        console.error("Error asignando delivery:", error);
        alert("No se pudo asignar el delivery");
    } finally {
        selectElement.disabled = false;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// =============================
// DIBUJAR TABLA
// =============================
function dibujarTabla(pedidos) {

    const contenedor = document.getElementById("no-more-tables");
    contenedor.innerHTML = "";

    const tabla = document.createElement('div');
    tabla.classList.add('table-responsive');

    const tablaInterna = document.createElement('table');
    tablaInterna.classList.add('table', 'table-bordered', 'table-striped', 'table-hover', 'table-condensed', 'cf');

    const encabezado = tablaInterna.createTHead();
    const filaEncabezado = encabezado.insertRow();

    var header_pedidos = [
        {title: "Celular", class: "numeric"},
        {title: "Nombre", class: ""},
        {title: "Cantidad", class: "numeric"},
        {title: "Estado Pedido", class: ""},
        {title: "Tipo de Pedido", class: ""},
        {title: "Hora entrega", class: "numeric"},
        {title: "Zona", class: ""},
        {title: "Comentarios", class: ""},
        {title: "Vendedor", class: ""},
        {title: "Delivery", class: ""}, // 👈 NUEVA COLUMNA
        {title: "Acciones", class: ""}
    ];

    for (const item of header_pedidos) {
        const th = document.createElement('th');
        th.textContent = item.title;
        if (item.class) th.classList.add(item.class);
        filaEncabezado.appendChild(th);
    }

    const cuerpo = tablaInterna.createTBody();

    pedidos.forEach(pedido => {

        const fila = cuerpo.insertRow();

        for (const key in pedido) {
            switch (key) {

                case 'pedido_celular':
                    const celda = fila.insertCell();
                    const enlace = document.createElement('a');
                    enlace.href = 'https://wa.me/591' + pedido[key];
                    enlace.textContent = pedido[key];
                    enlace.target = "_blank";
                    celda.appendChild(enlace);
                    celda.setAttribute('data-title', 'Celular');
                    break;

                case 'pedido_nombre':
                case 'pedido_cantidad':
                case 'pedido_estado':
                case 'pedido_tipo':
                case 'pedido_hora_entrega':
                case 'pedido_zona':
                case 'pedido_comentarios':
                case 'pedido_vendedor':
                    const celdaNormal = fila.insertCell();
                    celdaNormal.textContent = pedido[key];
                    celdaNormal.setAttribute('data-title', capitalize(key.replace('pedido_', '')));
                    break;

                default:
                    break;
            }
        }

        // =============================
        // DROPDOWN DELIVERY
        // =============================
        const celdaDelivery = fila.insertCell();
        celdaDelivery.setAttribute('data-title', 'Delivery');

        const selectDelivery = document.createElement("select");

        const optionDefault = document.createElement("option");
        optionDefault.value = "";
        optionDefault.textContent = "Sin asignar";
        selectDelivery.appendChild(optionDefault);

        deliveriesDisponibles.forEach(delivery => {
            const option = document.createElement("option");
            option.value = delivery.id;
            option.textContent = delivery.nombre;

            if (pedido.delivery == delivery.id) {
                option.selected = true;
            }

            selectDelivery.appendChild(option);
        });

        selectDelivery.addEventListener("change", function() {

            const nuevoDeliveryId = this.value;

            const confirmacion = confirm("¿Asignar este delivery al pedido?");
            if (confirmacion) {
                asignarDelivery(pedido._id, nuevoDeliveryId, this);
                pedido.delivery_id = nuevoDeliveryId;
            } else {
                this.value = pedido.delivery_id || "";
            }
        });

        celdaDelivery.appendChild(selectDelivery);

        // =============================
        // LINK MAPA
        // =============================
        const celdaAccion = fila.insertCell();
        celdaAccion.setAttribute('data-title', 'Acciones');

        if (pedido.pedido_latitud && pedido.pedido_longitud) {
            const link = document.createElement('a');
            link.href = 'https://www.google.com/maps/place/' + pedido.pedido_latitud + ',' + pedido.pedido_longitud;
            link.target = '_blank';
            link.textContent = 'Ir a mapa';
            celdaAccion.appendChild(link);
        }
    });

    tabla.appendChild(tablaInterna);
    contenedor.appendChild(tabla);
}

// =============================
// INIT
// =============================
(async () => {
    try {
        const pedidos = await obtenerPedidos();
        dibujarTabla(pedidos);
    } catch (error) {
        console.error('Error:', error);
    }
})();