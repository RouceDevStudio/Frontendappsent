const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");
const btnMiPerfil = document.getElementById("btn-mi-perfil");
const loadingState = document.getElementById("loading-state");

let todosLosItems = [];

function verificarTerminos() {
    const aceptado = localStorage.getItem("terminos_aceptados_v2");
    if (!aceptado) {
        alert("AVISO LEGAL:\n1. Servicio de alojamiento técnico.\n2. Responsabilidad del usuario.\n3. UpGames no edita contenido ajeno ni supervisa la propiedad intelectual.");
        localStorage.setItem("terminos_aceptados_v2", "true");
    }
}

async function cargarContenido() {
    verificarTerminos();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('id');

        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        
        if (loadingState) loadingState.style.display = "none";

        todosLosItems = data.filter(i => i.status === "aprobado");
        renderizar(todosLosItems);

        if (sharedId) {
            setTimeout(() => {
                const card = document.querySelector(`[data-id="${sharedId}"]`);
                if (card) card.click();
            }, 600);
        }
    } catch (e) { 
        if (loadingState) loadingState.innerHTML = "<p style='color:red;'>ERROR DE CONEXIÓN CLOUD</p>";
        console.error("Error en la red cloud."); 
    }
}

function renderizar(lista) {
    output.innerHTML = "";

    // LÓGICA DE "NO SE ENCONTRARON RESULTADOS"
    if (lista.length === 0) {
        output.innerHTML = `
            <div class="no-results">
                <ion-icon name="cloud-offline-outline"></ion-icon>
                <h3>¡Vaya! La nube está vacía</h3>
                <p>No encontramos lo que buscas. ¿Por qué no eres el primero en subirlo?</p>
                <a href="https://roucedevstudio.github.io/Frontendappback/" class="btn-subir-vacio">SUBIR ARCHIVO</a>
            </div>
        `;
        return;
    }

    lista.forEach(item => {
        const card = document.createElement("div");
        card.className = "juego-card";
        card.setAttribute("data-id", item._id);

        const estaOnline = (item.reportes || 0) < 3;
        const statusClase = estaOnline ? "status-online" : "status-review";
        const statusTexto = estaOnline ? "Online" : "En Revisión";
        const statusIcon = estaOnline ? "checkmark-circle-sharp" : "alert-circle-sharp";
        const categoriaLabel = item.category ? item.category : "Undefined";

        const esVideo = /\.(mp4|webm|mov)$/i.test(item.image);
        const media = esVideo 
            ? `<video src="${item.image}" class="juego-img" autoplay muted loop playsinline></video>`
            : `<img src="${item.image}" class="juego-img">`;

        card.innerHTML = `
            <div class="status-badge ${statusClase}">
                <ion-icon name="${statusIcon}"></ion-icon> <span>${statusTexto}</span>
            </div>
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            ${media}
            <div class="card-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <div style="color:var(--primary); font-size:10px;">@${item.usuario || 'Cloud User'}</div>
                    <span class="category-badge">${categoriaLabel}</span>
                </div>
                <h4 class="juego-titulo">${item.title}</h4>
                <div class="social-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); fav('${item._id}')"><ion-icon name="heart-sharp"></ion-icon></button>
                    <button class="action-btn" onclick="event.stopPropagation(); share('${item._id}')"><ion-icon name="share-social-sharp"></ion-icon></button>
                    <button class="action-btn" onclick="event.stopPropagation(); report('${item._id}')"><ion-icon name="flag-sharp"></ion-icon></button>
                </div>
                <p class="cloud-note">${item.description || 'Sin descripción.'}</p>
                <div class="boton-descargar-full" onclick="event.stopPropagation(); window.open('${item.link}', '_blank')">ACCEDER A LA NUBE</div>
                
                <div class="comentarios-section">
                    <h5 style="font-size: 0.7rem; color: #555; margin-bottom: 10px; text-transform: uppercase;">Zona de Opiniones</h5>
                    <div class="comentarios-list" id="list-${item._id}"></div>
                    <div class="add-comment">
                        <input type="text" id="input-${item._id}" placeholder="Escribe algo..." onclick="event.stopPropagation();">
                        <button onclick="event.stopPropagation(); postComm('${item._id}')">OK</button>
                    </div>
                </div>
            </div>
        `;

        card.onclick = () => {
            if (!card.classList.contains("expandida")) {
                card.classList.add("expandida");
                overlay.style.display = "block";
                document.body.style.overflow = "hidden";
                cargarComm(item._id);
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

// Funciones sociales y búsqueda se mantienen igual...
async function share(id) {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    await navigator.clipboard.writeText(url);
    alert("Enlace copiado.");
}

async function fav(id) {
    const user = localStorage.getItem("user_admin");
    if(!user) return alert("Inicia sesión.");
    await fetch(`${API_URL}/favoritos/add`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({usuario:user, itemId:id})
    });
    alert("Guardado en favoritos.");
}

async function report(id) {
    if(confirm("¿Reportar link caído?")) {
        await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
        alert("Reporte enviado.");
        cargarContenido();
    }
}

async function cargarComm(id) {
    const box = document.getElementById(`list-${id}`);
    const res = await fetch(`${API_URL}/comentarios/${id}`);
    const data = await res.json();
    box.innerHTML = data.map(c => `<div class="comm-item"><strong>${c.usuario}:</strong> ${c.texto}</div>`).join('');
}

async function postComm(id) {
    const user = localStorage.getItem("user_admin");
    const txt = document.getElementById(`input-${id}`).value;
    if(!user || !txt.trim()) return;
    await fetch(`${API_URL}/comentarios`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ usuario:user, texto:txt, itemId:id })
    });
    document.getElementById(`input-${id}`).value = "";
    cargarComm(id);
}

buscador.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = todosLosItems.filter(i => i.title.toLowerCase().includes(term));
    renderizar(filtrados);
};

btnMiPerfil.onclick = () => {
    const u = localStorage.getItem("user_admin");
    if(u) {
        localStorage.setItem("ver_perfil_de", u);
        window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
    } else {
        window.location.href = "https://roucedevstudio.github.io/LoginApp/";
    }
};

document.addEventListener("DOMContentLoaded", cargarContenido);
