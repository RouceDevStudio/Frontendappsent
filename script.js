const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");

let todosLosItems = [];
let todosLosUsuarios = []; 

// ==========================================
// 1. CARGA DE DATOS DESDE EL SERVIDOR
// ==========================================
async function cargarContenido() {
    try {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#5EFF43; padding:50px; font-family:monospace;">📡 ESCANEANDO SECTORES...</p>`;
        
        // Petición de Items (Juegos)
        const resItems = await fetch(`${API_URL}/items`);
        const dataItems = await resItems.json();
        // Filtramos solo los aprobados
        todosLosItems = Array.isArray(dataItems) ? dataItems.filter(i => i.status === "aprobado") : [];

        // Petición de Usuarios (RUTA CORREGIDA SEGÚN TU BACKEND)
        try {
            const resUsers = await fetch(`${API_URL}/auth/users`);
            if (resUsers.ok) {
                todosLosUsuarios = await resUsers.json();
            }
        } catch (e) {
            console.error("Error al obtener usuarios registrados:", e);
        }

        renderizar(todosLosItems);
    } catch (error) {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:red; padding:50px;">❌ FALLO DE CONEXIÓN CLOUD</p>`;
    }
}

// ==========================================
// 2. RENDERIZADO DE CARDS (JUEGOS Y PERFILES)
// ==========================================
function renderizar(lista, perfilesEncontrados = []) {
    output.innerHTML = "";

    // SECCIÓN DE PERFILES (CARDS)
    if (perfilesEncontrados.length > 0) {
        const pTitle = document.createElement("h3");
        pTitle.className = "seccion-titulo";
        pTitle.innerText = "COLABORADORES ENCONTRADOS";
        output.appendChild(pTitle);

        perfilesEncontrados.forEach(u => {
            const nombre = u.usuario; // Usamos .usuario según tu schema de Mongo
            const pCard = document.createElement("div");
            pCard.className = "perfil-card-busqueda";
            pCard.innerHTML = `
                <div class="perfil-card-avatar"><ion-icon name="person-circle-outline"></ion-icon></div>
                <span class="perfil-card-name">${nombre}</span>
                <button class="perfil-card-btn">VISITAR PERFIL</button>
            `;
            pCard.onclick = () => prepararPerfil(nombre);
            output.appendChild(pCard);
        });

        const hr = document.createElement("div");
        hr.style = "grid-column: 1/-1; height: 1px; background: rgba(94, 255, 67, 0.1); margin: 20px 0;";
        output.appendChild(hr);
    }

    // SECCIÓN DE JUEGOS
    if (lista.length === 0 && perfilesEncontrados.length === 0) {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#444; padding:50px;">Sin resultados en este cuadrante.</p>`;
        return;
    }

    lista.forEach((item) => {
        const card = document.createElement("div");
        card.className = "juego-card";
        const autor = item.usuario || 'Cloud User';
        const url = item.image || '';
        const esVideo = /\.(mp4|webm|mov|ogg)$/i.test(url);
        
        const mediaHtml = esVideo 
            ? `<video src="${url}" class="juego-img" autoplay muted loop playsinline></video>`
            : `<img src="${url}" class="juego-img" loading="lazy">`;

        card.innerHTML = `
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            ${mediaHtml}
            <div class="card-content">
                <div class="user-tag" onclick="event.stopPropagation(); prepararPerfil('${autor}')">
                    <ion-icon name="person-circle"></ion-icon> <span>${autor}</span>
                </div>
                <h4 class="juego-titulo">${item.title}</h4>
                <p class="cloud-note">${item.description || 'Sin descripción.'}</p>
                <div class="boton-descargar">ACCEDER A LA NUBE</div>
            </div>
        `;

        card.onclick = () => {
            if (!card.classList.contains("expandida")) {
                document.querySelectorAll(".juego-card").forEach(c => c.classList.remove("expandida"));
                card.classList.add("expandida");
                overlay.style.display = "block";
                document.body.style.overflow = "hidden";
                card.querySelector(".boton-descargar").onclick = (e) => {
                    e.stopPropagation();
                    window.open(item.link, "_blank");
                };
            }
        };

        card.querySelector(".close-btn").onclick = (e) => {
            e.stopPropagation();
            card.classList.remove("expandida");
            overlay.style.display = "none";
            document.body.style.overflow = "auto";
        };

        output.appendChild(card);
    });
}

// ==========================================
// 3. BUSCADOR Y LÓGICA DE PERFIL
// ==========================================
buscador.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (term.length === 0) {
        renderizar(todosLosItems);
        return;
    }

    // Filtrar juegos
    const filtrados = todosLosItems.filter(item => 
        (item.title || "").toLowerCase().includes(term) || 
        (item.usuario || "").toLowerCase().includes(term)
    );

    // Filtrar usuarios de la lista real del servidor
    const usuariosMatch = todosLosUsuarios.filter(u => 
        (u.usuario || "").toLowerCase().includes(term)
    );

    renderizar(filtrados, usuariosMatch);
});

function prepararPerfil(nombre) {
    if (!nombre) return;
    localStorage.setItem("ver_perfil_de", nombre.trim());
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

overlay.onclick = () => {
    document.querySelectorAll(".juego-card.expandida").forEach(c => c.classList.remove("expandida"));
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
};

document.addEventListener("DOMContentLoaded", cargarContenido);
