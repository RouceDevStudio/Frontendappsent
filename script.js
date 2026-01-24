const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");

let todosLosItems = [];

// 1. CARGAR DATOS DESDE MONGODB (Vía tu API en Render)
async function cargarContenido() {
  try {
    // Agregamos un mensaje de carga para que el usuario no vea la pantalla vacía
    output.innerHTML = "<p style='color:#5EFF43; text-align:center; width:100%;'>Cargando juegos...</p>";

    const res = await fetch(`${API_URL}/items`);
    const data = await res.json();
    
    // Verificamos que data sea un array (MongoDB devuelve un array de documentos)
    const listaBruta = Array.isArray(data) ? data : [];
    
    // FILTRO DE SEGURIDAD: Solo mostramos lo que el Admin aprobó
    todosLosItems = listaBruta.filter(item => item.status === "aprobado");
    
    renderizar(todosLosItems);
    
  } catch (error) {
    console.error("Error cargando el contenido:", error);
    output.innerHTML = "<p style='color:white; text-align:center; width:100%;'>Servidor en mantenimiento. Reintenta en 30 segundos.</p>";
  }
}

// 2. RENDERIZAR TARJETAS (Optimizado para datos de MongoDB)
function renderizar(lista) {
  output.innerHTML = "";
  
  if (lista.length === 0) {
    output.innerHTML = "<p style='color:white; text-align:center; width:100%; margin-top:20px;'>No hay juegos verificados aún. ¡Vuelve pronto!</p>";
    return;
  }

  lista.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("juego-card");
    
    // Usamos el operador || para evitar errores si falta algún dato en la DB
    div.innerHTML = `
      ${item.image ? `<img src="${item.image}" class="juego-img" alt="${item.title}">` : ''}
      <div class="card-content">
        <h4 class="juego-titulo">${item.title || "Juego sin título"}</h4>
        <p class="juego-descripcion">${item.description || "Sin descripción disponible."}</p>
        <a href="${item.link}" class="boton-descargar" target="_blank">DESCARGAR AHORA</a>
      </div>
    `;
    output.appendChild(div);
  });
}

// 3. BUSCADOR TIEMPO REAL
if (buscador) {
  buscador.addEventListener("input", (e) => {
    const textoUsuario = e.target.value.toLowerCase().trim();
    
    const itemsFiltrados = todosLosItems.filter(item => {
      const titulo = item.title ? item.title.toLowerCase() : "";
      const desc = item.description ? item.description.toLowerCase() : "";
      // Ahora también busca dentro de la descripción para ser más pro
      return titulo.includes(textoUsuario) || desc.includes(textoUsuario);
    });
    
    renderizar(itemsFiltrados);
  });
}

// Iniciar la carga al abrir la app
cargarContenido();
