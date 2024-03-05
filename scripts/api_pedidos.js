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

  
  function dibujarTabla(pedidos) {
    const tabla = document.createElement('table');
    const encabezado = tabla.createTHead();
    const filaEncabezado = encabezado.insertRow();
    for (const key in pedidos[0]) {
      const th = document.createElement('th');
      th.textContent = key;
      filaEncabezado.appendChild(th);
    }
    const cuerpo = tabla.createTBody();
    pedidos.forEach(pedido => {
      const fila = cuerpo.insertRow();
      for (const key in pedido) {
        const celda = fila.insertCell();
        celda.textContent = pedido[key];
      }
    });
    document.body.appendChild(tabla);
  }
  

  (async () => {
    try {
      const pedidos = await obtenerPedidos();
      dibujarTabla(pedidos);
    } catch (error) {
      console.error('Error:', error);
    }
  })();
  