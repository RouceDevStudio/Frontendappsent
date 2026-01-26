const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");

// 1. Identificamos el botón de perfil de la barra superior
// Usamos un selector que busque el ícono de usuario que tienes en el Header
const btnMiPerfilPropio = document.querySelector(".fa-user-circle") || 
                           document.querySelector("ion-icon[name='person-circle']")?.parentElement ||
                           document.querySelector(".perfil-icon");

let todosLosItems = [];
let todosLosUsuarios = [];

async function cargarContenido() {
    try {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#5EFF43; padding:50px; font-family:monospace;">📡 ESCANEANDO RED...</p>`;
        
        const resItems = await fetch(`${API_URL}/items`);
        const dataItems = await resItems.json();
        todosLosItems = Array.isArray(dataItems) ? dataItems.filter(i => i.status === "aprobado") : [];

        try {
            const resUsers = await fetch(`${API_URL}/auth/users`);
            if (resUsers.ok) {
                todosLosUsuarios = await resUsers.json();
            }
        } catch (e) { console.error("Error en base de datos de usuarios"); }

        renderizar(todosLosItems);
    } catch (error) {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:red; padding:50px;">❌ ERROR DE CONEXIÓN</p>`;
    }
}

function renderizar(lista, perfilesEncontrados = []) {
    output.innerHTML = "";

    // Muestra perfiles encontrados en la búsqueda
    if (perfilesEncontrados.length > 0) {
        const pTitle = document.createElement("h3");
        pTitle.className = "seccion-titulo";
        pTitle.innerText = "COLABORADORES ENCONTRADOS";
        output.appendChild(pTitle);

        perfilesEncontrados.forEach(u => {
            const nombre = u.usuario;
            const pCard = document.createElement("div");
            pCard.className = "perfil-card-busqueda";
            pCard.innerHTML = `
                <div class="perfil-card-avatar"><ion-icon name="person-circle-outline"></ion-icon></div>
                <span class="perfil-card-name">${nombre}</span>
                <button class="perfil-card-btn">VER PERFIL</button>
            `;
            pCard.onclick = () => prepararPerfil(nombre);
            output.appendChild(pCard);
        });
        const hr = document.createElement("div");
        hr.style = "grid-column: 1/-1; height: 1px; background: rgba(94, 255, 67, 0.1); margin: 20px 0;";
        output.appendChild(hr);
    }

    // Muestra las cartas de juegos
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
            }
        };

        card.querySelector(".close-btn").onclick = (e) => {
            e.stopPropagation();
            card.classList.remove("expandida");
            overlay.style.display = "none";
        };
        output.appendChild(card);
    });
}

// LÓGICA DE NAVEGACIÓN GENERAL
function prepararPerfil(nombre) {
    if (!nombre) return;
    localStorage.setItem("ver_perfil_de", nombre.trim());
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

// --- ESTO ES LO QUE SOLUCIONA TU PROBLEMA ---
// Al hacer clic en el ícono de perfil superior, te lleva a TU perfil
if (btnMiPerfilPropio) {
    btnMiPerfilPropio.style.cursor = "pointer";
    btnMiPerfilPropio.onclick = () => {
        // Obtenemos el nombre con el que el usuario INICIÓ SESIÓN
        const miUsuarioLogueado = localStorage.getItem("user_admin"); 
        
        if (miUsuarioLogueado) {
            prepararPerfil(miUsuarioLogueado);
        } else {
            alert("No se detectó una sesión activa. Por favor, inicia sesión.");
            window.location.href = "https://roucedevstudio.github.io/LoginApp/";
        }
    };
}

buscador.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (term.length === 0) { renderizar(todosLosItems); return; }
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
};

document.addEventListener("DOMContentLoaded", cargarContenido);
