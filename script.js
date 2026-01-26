const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");

// Selector del ícono de perfil superior
const btnMiPerfilPropio = document.querySelector(".perfil-icon") || 
                           document.querySelector("#btn-mi-perfil") ||
                           document.querySelector("ion-icon[name='person-circle']")?.parentElement;

let todosLosItems = [];
let todosLosUsuarios = [];

// ==========================================
// 1. ALERTA LEGAL OBLIGATORIA (ESTRICTA)
// ==========================================
function verificarTerminos() {
    const aceptado = localStorage.getItem("terminos_aceptados_v2");
    if (!aceptado) {
        const mensajeLegal = 
            "AVISO LEGAL IMPORTANTE:\n\n" +
            "1. Esta aplicación es exclusivamente un servicio de alojamiento técnico en la nube.\n" +
            "2. No administramos, no editamos, ni somos dueños del contenido subido por los usuarios.\n" +
            "3. La responsabilidad legal, civil y penal del contenido recae netamente en el usuario que lo publica.\n" +
            "4. UpGames NO puede editar ni eliminar contenido ajeno, salvo en casos de incumplimiento de nuestras políticas de seguridad (contenido para adultos o material delicado/prohibido).\n\n" +
            "Al presionar 'Aceptar', declaras que comprendes que eres el único responsable de lo que subas.";
        
        alert(mensajeLegal);
        localStorage.setItem("terminos_aceptados_v2", "true");
    }
}

// ==========================================
// 2. CARGA DE DATOS
// ==========================================
async function cargarContenido() {
    try {
        verificarTerminos(); // Se dispara al iniciar la App
        
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

// ==========================================
// 3. RENDERIZADO
// ==========================================
function renderizar(lista, perfilesEncontrados = []) {
    output.innerHTML = "";

    // Sección de Perfiles (Cards Pro)
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

    // Renderizado de Juegos / Videos
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
// 4. NAVEGACIÓN (Botón Perfil y Redirección)
// ==========================================
function prepararPerfil(nombre) {
    if (!nombre) return;
    localStorage.setItem("ver_perfil_de", nombre.trim());
    window.location.assign("https://roucedevstudio.github.io/PerfilApp/");
}

if (btnMiPerfilPropio) {
    btnMiPerfilPropio.style.cursor = "pointer";
    btnMiPerfilPropio.addEventListener("click", (e) => {
        e.preventDefault();
        const miUsuarioLogueado = localStorage.getItem("user_admin"); 
        
        if (miUsuarioLogueado) {
            prepararPerfil(miUsuarioLogueado);
        } else {
            alert("Inicia sesión para acceder a tu perfil.");
            window.location.assign("https://roucedevstudio.github.io/LoginApp/");
        }
    });
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
    document.body.style.overflow = "auto";
};

document.addEventListener("DOMContentLoaded", cargarContenido);
