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
      location.reload();
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

  function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  function dibujarTabla(pedidos) {
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
        {title: "Acciones", class: ""}
    ];

    for (const item of header_pedidos) {
      const th = document.createElement('th');
      th.textContent = item.title;
      if (item.class) { // Verifica si item.class tiene un valor
          th.classList.add(item.class);
      }
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
                    enlace.href = 'https://wa.me/591' + pedido[key]; // Enlace de WhatsApp con el número de celular
                    enlace.textContent = pedido[key];
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
            celda.setAttribute('data-title', 'Acciones');
        }
    });

    tabla.appendChild(tablaInterna);
    document.getElementById("no-more-tables").appendChild(tabla);
}


  

  (async () => {
    try {
      const pedidos = await obtenerPedidos();
      dibujarTabla(pedidos);
    } catch (error) {
      console.error('Error:', error);
    }
  })();
  