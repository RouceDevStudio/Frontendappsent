const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");

// 1. Identificamos el ícono de perfil en la parte superior derecha
// Buscamos por la clase común o por el nombre del ícono de Ionic
const btnMiPerfilPropio = document.querySelector(".perfil-icon") || 
                           document.querySelector("ion-icon[name='person-circle']")?.parentElement;

let todosLosItems = [];
let todosLosUsuarios = [];

// ==========================================
// 2. CARGA INICIAL DE DATOS
// ==========================================
async function cargarContenido() {
    try {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#5EFF43; padding:50px; font-family:monospace; letter-spacing:2px;">⚡ SINCRONIZANDO CON LA NUBE...</p>`;
        
        // Petición de Juegos (Items)
        const resItems = await fetch(`${API_URL}/items`);
        const dataItems = await resItems.json();
        todosLosItems = Array.isArray(dataItems) ? dataItems.filter(i => i.status === "aprobado") : [];

        // Petición de Usuarios Registrados (Ruta: /auth/users)
        try {
            const resUsers = await fetch(`${API_URL}/auth/users`);
            if (resUsers.ok) {
                todosLosUsuarios = await resUsers.json();
            }
        } catch (e) { 
            console.error("Error al obtener la base de datos de usuarios."); 
        }

        renderizar(todosLosItems);
    } catch (error) {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#ff4343; padding:50px;">❌ ERROR DE CONEXIÓN CON EL SERVIDOR</p>`;
    }
}

// ==========================================
// 3. RENDERIZADO DINÁMICO
// ==========================================
function renderizar(lista, perfilesEncontrados = []) {
    output.innerHTML = "";

    // SECCIÓN DE PERFILES (Si el usuario está buscando)
    if (perfilesEncontrados.length > 0) {
        const pTitle = document.createElement("h3");
        pTitle.className = "seccion-titulo";
        pTitle.innerText = "COLABORADORES ENCONTRADOS";
        output.appendChild(pTitle);

        perfilesEncontrados.forEach(u => {
            const nombre = u.usuario; // Usamos el campo 'usuario' de tu schema
            const pCard = document.createElement("div");
            pCard.className = "perfil-card-busqueda";
            pCard.innerHTML = `
                <div class="perfil-card-avatar"><ion-icon name="person-circle-outline"></ion-icon></div>
                <span class="perfil-card-name">${nombre}</span>
                <button class="perfil-card-btn" onclick="event.stopPropagation(); prepararPerfil('${nombre}')">VER PERFIL</button>
            `;
            pCard.onclick = () => prepararPerfil(nombre);
            output.appendChild(pCard);
        });

        // Línea divisoria estética
        const hr = document.createElement("div");
        hr.style = "grid-column: 1/-1; height: 1px; background: rgba(94, 255, 67, 0.15); margin: 30px 0;";
        output.appendChild(hr);
    }

    if (lista.length === 0 && perfilesEncontrados.length === 0) {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#444; padding:50px;">NO SE ENCONTRARON RESULTADOS</p>`;
        return;
    }

    // SECCIÓN DE JUEGOS / APORTES
    lista.forEach((item) => {
        const card = document.createElement("div");
        card.className = "juego-card";
        const autor = item.usuario || 'Cloud User';
        const url = item.image || '';
        
        // Detección automática de Video
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

        card.addEventListener("click", () => {
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
        });

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
// 4. LÓGICA DE NAVEGACIÓN Y BUSCADOR
// ==========================================

// Función para ir a cualquier perfil (usada por el buscador y tags)
function prepararPerfil(nombre) {
    if (!nombre || nombre === 'Cloud User') return;
    localStorage.setItem("ver_perfil_de", nombre.trim());
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

// EVENTO PARA EL ÍCONO DE TU PERFIL (Barra superior)
if (btnMiPerfilPropio) {
    btnMiPerfilPropio.style.cursor = "pointer";
    btnMiPerfilPropio.onclick = () => {
        // Obtenemos el usuario que inició sesión
        const miUsuarioActual = localStorage.getItem("user_admin"); 
        
        if (miUsuarioActual) {
            // Guardamos tu nombre para que PerfilApp te reconozca como dueño
            localStorage.setItem("ver_perfil_de", miUsuarioActual.trim());
            window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
        } else {
            // Si no hay sesión, mandamos al Login
            alert("Acceso denegado. Por favor inicia sesión.");
            window.location.href = "https://roucedevstudio.github.io/LoginApp/";
        }
    };
}

// Buscador en tiempo real
buscador.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (term.length === 0) {
        renderizar(todosLosItems);
        return;
    }

    const filtrados = todosLosItems.filter(item => 
        (item.title || "").toLowerCase().includes(term) || 
        (item.usuario || "").toLowerCase().includes(term)
    );

    const usuariosMatch = todosLosUsuarios.filter(u => 
        (u.usuario || "").toLowerCase().includes(term)
    );

    renderizar(filtrados, usuariosMatch);
});

overlay.onclick = () => {
    document.querySelectorAll(".juego-card.expandida").forEach(c => c.classList.remove("expandida"));
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
};

document.addEventListener("DOMContentLoaded", cargarContenido);
