const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");
const btnMiPerfil = document.getElementById("btn-mi-perfil");

let todosLosItems = [];

// ==========================================
// 1. ALERTA LEGAL ORIGINAL (PROTECCIÓN TOTAL)
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
// 2. CARGA DE CONTENIDO
// ==========================================
async function cargarContenido() {
    verificarTerminos();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('id');

        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        todosLosItems = data.filter(i => i.status === "aprobado");

        renderizar(todosLosItems);

        if (sharedId) {
            setTimeout(() => {
                const card = document.querySelector(`[data-id="${sharedId}"]`);
                if (card) card.click();
            }, 600);
        }
    } catch (e) { console.error("Error en la red cloud."); }
}

// ==========================================
// 3. RENDERIZADO DE CARTAS (CON ESTADO DE LINK)
// ==========================================
function renderizar(lista) {
    output.innerHTML = "";
    lista.forEach(item => {
        const card = document.createElement("div");
        card.className = "juego-card";
        card.setAttribute("data-id", item._id);

        // Lógica de Estado de Link (Check de Verificación)
        const numReportes = item.reportes || 0;
        const estaOnline = numReportes < 3;
        const statusClase = estaOnline ? "status-online" : "status-review";
        const statusTexto = estaOnline ? "Online" : "En Revisión";
        const statusIcon = estaOnline ? "checkmark-circle-sharp" : "alert-circle-sharp";

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
                <div class="user-tag">
                    <ion-icon name="person-circle"></ion-icon> <span>${item.usuario || 'Cloud User'}</span>
                </div>
                <h4 class="juego-titulo">${item.title}</h4>
                
                <div class="social-actions">
                    <button class="action-btn" title="Favorito" onclick="event.stopPropagation(); fav('${item._id}')"><ion-icon name="heart-sharp"></ion-icon></button>
                    <button class="action-btn" title="Compartir" onclick="event.stopPropagation(); share('${item._id}', '${item.title}')"><ion-icon name="share-social-sharp"></ion-icon></button>
                    <button class="action-btn" title="Reportar Link" onclick="event.stopPropagation(); report('${item._id}')"><ion-icon name="flag-sharp"></ion-icon></button>
                </div>

                <p class="cloud-note">${item.description || 'Sin descripción disponible.'}</p>
                
                <div class="info-verificacion">
                    <div class="verificado-flex">
                        <span class="status-text ${estaOnline ? 'online' : 'review'}">
                            <ion-icon name="${statusIcon}"></ion-icon> Estado: ${statusTexto}
                        </span>
                    </div>
                </div>

                <div class="boton-descargar-full" onclick="event.stopPropagation(); window.open('${item.link}', '_blank')">ACCEDER A LA NUBE</div>
                
                <div class="comentarios-section">
                    <h5>Playlist de Comentarios</h5>
                    <div class="comentarios-list" id="list-${item._id}"></div>
                    <div class="add-comment">
                        <input type="text" id="input-${item._id}" placeholder="Escribe un comentario..." onclick="event.stopPropagation();">
                        <button onclick="event.stopPropagation(); postComm('${item._id}')">ENVIAR</button>
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

// ==========================================
// 4. FUNCIONES SOCIALES Y COMENTARIOS
// ==========================================
async function fav(id) {
    const user = localStorage.getItem("user_admin");
    if(!user) return alert("Inicia sesión para guardar en tu bóveda.");
    const res = await fetch(`${API_URL}/favoritos/add`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({usuario:user, itemId:id})
    });
    const d = await res.json(); alert(d.mensaje || "Guardado.");
}

function share(id, title) {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard.writeText(url);
    alert("Enlace de la bóveda copiado.");
}

async function report(id) {
    if(confirm("¿Reportar que este link no funciona?")) {
        await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
        alert("Reporte enviado. Si acumulamos más de 3, el estado cambiará a Revisión.");
        cargarContenido(); // Recargamos para ver el cambio de estado si aplica
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

// ==========================================
// 5. NAVEGACIÓN Y BÚSQUEDA
// ==========================================
buscador.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    renderizar(todosLosItems.filter(i => i.title.toLowerCase().includes(term)));
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
