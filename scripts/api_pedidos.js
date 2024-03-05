
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