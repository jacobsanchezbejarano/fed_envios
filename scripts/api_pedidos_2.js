const API_URL_ = true ? "http://localhost:3000" : 'https://envios-26fg.onrender.com';
const mapa = document.getElementById('map') ? L.map('map').setView([-17.7833, -63.1821], 12):null;

var markersLayer;
var pedidosGlobal = [];

if(mapa){

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapa);
    markersLayer = L.layerGroup().addTo(mapa);

}


// Lista predeterminada de deliveries
const deliveriesDisponibles = [
  { id: "josema", nombre: "Josema", color: "red" },
  { id: "niki", nombre: "Niki", color: "blue" },
  { id: "dayana", nombre: "Dayana", color: "green" },
  { id: "rolando", nombre: "Rolando", color: "orange" },
];

// =============================
// VARIABLES MAPA
// =============================


function getDeliveryFilter() {
    const params = new URLSearchParams(window.location.search);
    return params.get("delivery");
}

// =============================
// ICONOS POR DELIVERY
// =============================

function obtenerColorDelivery(id) {
    const delivery = deliveriesDisponibles.find(d => d.id === id);
    return delivery ? delivery.color : "grey";
}

function crearIcono(color) {
    return L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25,41],
        iconAnchor: [12,41],
        popupAnchor: [1,-34],
        shadowSize: [41,41]
    });
}

// =============================
// POPUP PEDIDO
// =============================

function crearPopupPedido(pedido) {

    let opcionesDelivery = `<option value="">Sin asignar</option>`;

    deliveriesDisponibles.forEach(d => {
        opcionesDelivery += `
        <option value="${d.id}" ${pedido.delivery === d.id ? "selected":""}>
            ${d.nombre}
        </option>`;
    });

    return `

    <div style="min-width:260px">

    <h3 style="margin:0">${pedido.pedido_nombre}</h3>

    <b>Hora:</b> ${pedido.pedido_hora_entrega}<br>
    <b>Cantidad:</b> ${pedido.pedido_cantidad}<br>
    <b>Zona:</b> ${pedido.pedido_zona}<br>
    <b>Tipo:</b> ${pedido.pedido_tipo}<br>
    <b>Estado:</b> ${pedido.pedido_estado}<br>

    <br>

    <b>Teléfono:</b><br>
    <a target="_blank" href="https://wa.me/591${pedido.pedido_celular}">
    ${pedido.pedido_celular}
    </a>

    <br><br>

    <b>Asignar delivery</b><br>

    <select onchange="asignarDelivery('${pedido._id}',this.value,this)" style="width:100%">
        ${opcionesDelivery}
    </select>

    <br><br>

    <a target="_blank"
    href="https://www.google.com/maps/place/${pedido.pedido_latitud},${pedido.pedido_longitud}">
    Abrir en Google Maps
    </a>

    </div>

    `;
}

// =============================
// MOSTRAR PEDIDOS EN MAPA
// =============================

function mostrarPedidosEnMapa(pedidos) {

    markersLayer.clearLayers();

    const deliveryFilter = getDeliveryFilter();

    pedidos.forEach(pedido => {

        if (!pedido.pedido_latitud || !pedido.pedido_longitud) return;

        if (deliveryFilter && pedido.delivery !== deliveryFilter) return;

        const color = obtenerColorDelivery(pedido.delivery);

        const icon = crearIcono(color);

        const marker = L.marker(
            [pedido.pedido_latitud, pedido.pedido_longitud],
            { icon: icon }
        );

        marker.bindPopup(crearPopupPedido(pedido));

        markersLayer.addLayer(marker);

    });

}

// =============================
// BOTON VER MAPA
// =============================

function verPedidosMapa() {

    if(!document.getElementById('map') ) return;

    document.getElementById("map").style.display = "block";

    if (!mapa) {
        initMapa();
    }

    mostrarPedidosEnMapa(pedidosGlobal);
}

// =============================
// ENVIAR PEDIDO
// =============================

async function enviarPedido(event) {

    event.preventDefault();

    const formData = new FormData(document.getElementById("pedidoForm"));
    const data = Object.fromEntries(formData.entries());

    try {

      const response = await fetch(`${API_URL_}/pedidos`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });

      if(!response.ok){
        throw new Error('Error al enviar');
      }

      alert('Datos enviados exitosamente');

      location.reload();

    } catch(error) {

      console.error(error);

    }
}

// =============================
// OBTENER PEDIDOS
// =============================

async function obtenerPedidos(){

    try{

      const response = await fetch(`${API_URL_}/pedidos`);

      if(!response.ok){
        throw new Error('Error al obtener pedidos');
      }

      return await response.json();

    }catch(error){

      console.error(error);

      throw error;

    }
}

// =============================
// ASIGNAR DELIVERY
// =============================

async function asignarDelivery(idPedido, deliveryId, selectElement) {

    try {

        selectElement.disabled = true;

        const response = await fetch(`${API_URL_}/pedidos/delivery/${idPedido}`,{
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({delivery:deliveryId})
        });

        if(!response.ok){
            throw new Error("Error asignando delivery");
        }

        console.log("Delivery asignado");

    } catch(error){

        console.error(error);

        alert("No se pudo asignar delivery");

    } finally {

        selectElement.disabled=false;

    }

}

function capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// =============================
// TABLA
// =============================

function dibujarTabla(pedidos){

    const contenedor=document.getElementById("no-more-tables");

    if(!contenedor) return;

    contenedor.innerHTML="";

    const tabla=document.createElement('div');

    tabla.classList.add('table-responsive');

    const tablaInterna=document.createElement('table');

    tablaInterna.classList.add('table','table-bordered','table-striped');

    const encabezado=tablaInterna.createTHead();

    const filaEncabezado=encabezado.insertRow();

    var header_pedidos=[
        {title:"Celular"},
        {title:"Nombre"},
        {title:"Cantidad"},
        {title:"Estado Pedido"},
        {title:"Tipo de Pedido"},
        {title:"Hora entrega"},
        {title:"Zona"},
        {title:"Comentarios"},
        {title:"Vendedor"},
        {title:"Delivery"},
        {title:"Acciones"}
    ];

    for(const item of header_pedidos){

        const th=document.createElement('th');

        th.textContent=item.title;

        filaEncabezado.appendChild(th);

    }

    const cuerpo=tablaInterna.createTBody();

    pedidos.forEach(pedido=>{

        const fila=cuerpo.insertRow();

        for(const key in pedido){

            switch(key){

                case 'pedido_celular':

                    const celda=fila.insertCell();

                    const enlace=document.createElement('a');

                    enlace.href='https://wa.me/591'+pedido[key];

                    enlace.textContent=pedido[key];

                    enlace.target="_blank";

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

                    const celdaNormal=fila.insertCell();

                    celdaNormal.textContent=pedido[key];

                    break;

                default:

                    break;

            }

        }

        const celdaDelivery=fila.insertCell();

        const selectDelivery=document.createElement("select");

        const optionDefault=document.createElement("option");

        optionDefault.value="";

        optionDefault.textContent="Sin asignar";

        selectDelivery.appendChild(optionDefault);

        deliveriesDisponibles.forEach(delivery=>{

            const option=document.createElement("option");

            option.value=delivery.id;

            option.textContent=delivery.nombre;

            if(pedido.delivery==delivery.id){

                option.selected=true;

            }

            selectDelivery.appendChild(option);

        });

        selectDelivery.addEventListener("change",function(){

            const nuevoDeliveryId=this.value;

            const confirmacion=confirm("¿Asignar este delivery al pedido?");

            if(confirmacion){

                asignarDelivery(pedido._id,nuevoDeliveryId,this);

                pedido.delivery_id=nuevoDeliveryId;

            }else{

                this.value=pedido.delivery_id || "";

            }

        });

        celdaDelivery.appendChild(selectDelivery);

        const celdaAccion=fila.insertCell();

        if(pedido.pedido_latitud && pedido.pedido_longitud){

            const link=document.createElement('a');

            link.href='https://www.google.com/maps/place/'+pedido.pedido_latitud+','+pedido.pedido_longitud;

            link.target='_blank';

            link.textContent='Ir a mapa';

            celdaAccion.appendChild(link);

        }

    });

    tabla.appendChild(tablaInterna);

    contenedor.appendChild(tabla);

}

// =============================
// INIT
// =============================

(async()=>{

    try{

        pedidosGlobal = await obtenerPedidos();

        dibujarTabla(pedidosGlobal);
        verPedidosMapa();

    }catch(error){

        console.error(error);

    }

})();