const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");

let todosLosItems = [];

// 1. FUNCIÓN PARA CARGAR LOS DATOS DESDE EL SERVIDOR
async function cargarContenido() {
  try {
    const res = await fetch(`${API_URL}/items`);
    const data = await res.json();
    
    // --- CAMBIO CLAVE AQUÍ ---
    // Filtramos para que la App solo guarde los juegos APROBADOS
    const listaBruta = Array.isArray(data) ? data : [];
    todosLosItems = listaBruta.filter(item => item.status === "aprobado");
    // -------------------------
    
    renderizar(todosLosItems);
    
  } catch (error) {
    console.error("Error cargando el contenido:", error);
    output.innerHTML = "<p style='color:white; text-align:center;'>Error al conectar con el servidor.</p>";
  }
}

// 2. FUNCIÓN PARA "DIBUJAR" LAS TARJETAS (Sin cambios, solo renderiza)
function renderizar(lista) {
  output.innerHTML = "";
  
  if (lista.length === 0) {
    output.innerHTML = "<p style='color:white; text-align:center; width:100%;'>No hay juegos disponibles por ahora.</p>";
    return;
  }

  lista.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("juego-card");
    
    div.innerHTML = `
      ${item.image ? `<img src="${item.image}" class="juego-img" alt="${item.title}">` : ''}
      <div class="card-content">
        <h4 class="juego-titulo">${item.title}</h4>
        <p class="juego-descripcion">${item.description}</p>
        <a href="${item.link}" class="boton-descargar" target="_blank">Descargar ahora</a>
      </div>
    `;
    output.appendChild(div);
  });
}

// 3. LÓGICA DEL BUSCADOR (Filtrará solo sobre los ya aprobados)
if (buscador) {
  buscador.addEventListener("input", (e) => {
    const textoUsuario = e.target.value.toLowerCase();
    const itemsFiltrados = todosLosItems.filter(item => {
      const titulo = item.title ? item.title.toLowerCase() : "";
      return titulo.includes(textoUsuario);
    });
    renderizar(itemsFiltrados);
  });
}

// EJECUCIÓN INICIAL
cargarContenido();
