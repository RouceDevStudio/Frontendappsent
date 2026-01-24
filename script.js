const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");

// Variable global para guardar los datos y poder filtrarlos
let todosLosItems = [];

// 1. FUNCIÓN PARA CARGAR LOS DATOS DESDE EL SERVIDOR
async function cargarContenido() {
  try {
    const res = await fetch(`${API_URL}/items`);
    const data = await res.json();
    
    // Guardamos una copia en nuestra variable global
    todosLosItems = Array.isArray(data) ? data : [];
    
    // Mostramos todo al cargar la página
    renderizar(todosLosItems);
    
  } catch (error) {
    console.error("Error cargando el contenido:", error);
    output.innerHTML = "<p style='color:white; text-align:center;'>Error al conectar con el servidor.</p>";
  }
}

// 2. FUNCIÓN PARA "DIBUJAR" LAS TARJETAS EN EL HTML
function renderizar(lista) {
  output.innerHTML = "";
  
  if (lista.length === 0) {
    output.innerHTML = "<p style='color:white; text-align:center; width:100%;'>No se encontraron resultados.</p>";
    return;
  }

  lista.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("juego-card");
    
    // Estructura interna de la tarjeta
    div.innerHTML = `
      ${item.image ? `<img src="${item.image}" class="juego-img" alt="${item.title}">` : ''}
      <div class="card-content">
        <h4 class="juego-titulo">${item.title}</h4>
        <p class="juego-descripcion">${item.description}</p>
        <a href="${item.link}" class="boton-descargar">Descargar ahora</a>
      </div>
    `;
    output.appendChild(div);
  });
}

// 3. LÓGICA DEL BUSCADOR
if (buscador) {
  buscador.addEventListener("input", (e) => {
    const textoUsuario = e.target.value.toLowerCase();

    // Filtramos los items basándonos en el título
    const itemsFiltrados = todosLosItems.filter(item => {
      const titulo = item.title ? item.title.toLowerCase() : "";
      return titulo.includes(textoUsuario);
    });

    // Renderizamos solo los resultados filtrados
    renderizar(itemsFiltrados);
  });
}

// EJECUCIÓN INICIAL
cargarContenido();
