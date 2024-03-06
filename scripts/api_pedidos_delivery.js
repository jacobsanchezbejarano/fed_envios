const urlParams = new URLSearchParams(window.location.search);
const delivery = urlParams.get('delivery'); // Devuelve 'valor1'

async function obtenerPedidosPorDelivery(deliveryId) {
    try {
        const response = await fetch(`https://envios-26fg.onrender.com/pedidos/delivery/${deliveryId}`);
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
          switch (key) {
              case 'pedido_celular':
                  const celda = fila.insertCell();
                  const enlace = document.createElement('a');
                  enlace.href = 'https://wa.me/591' + pedido[key]; // Enlace de WhatsApp con el número de celular
                  enlace.textContent = pedido[key];
                  celda.appendChild(enlace);
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
      
      // Agregar botón "Marcar entregado" y manejar su clic
      const celdaBoton = fila.insertCell();
      const boton = document.createElement('button');
      boton.textContent = 'Marcar entregado';
      boton.addEventListener('click', function() {
          // Mostrar mensaje de confirmación
          const confirmacion = confirm('¿Desea marcar este pedido como entregado?');
          if (confirmacion) {
              marcarComoEntregado(pedido._id);
          }
      });
      celdaBoton.appendChild(boton);
  });
  
    document.getElementById("lista_pedidos").appendChild(tabla);
}

async function marcarComoEntregado(idPedido) {
    try {
        const response = await fetch(`https://envios-26fg.onrender.com/pedidos/${idPedido}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: 'Pagado/Entregado' }) // Estado a actualizar
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
  

  (async () => {
    try {
      const pedidos = await obtenerPedidosPorDelivery(delivery);
      dibujarTabla(pedidos);
    } catch (error) {
      console.error('Error:', error);
    }
  })();
  