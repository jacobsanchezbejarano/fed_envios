function obtenerApiKey() {

    let apiKey = localStorage.getItem("apiKey");

    if (!apiKey) {

        apiKey = prompt("Ingrese su API Key:");

        if (!apiKey) {
            alert("Se requiere una API Key para continuar.");
            location.reload();
            return;
        }

        localStorage.setItem("apiKey", apiKey);
    }

    return apiKey;
}

obtenerApiKey();